import { localDb } from '../../data/local/database';
import { localBrowserBridge } from './LocalBrowserBridge';
import { instagramBrowserPublisher } from '../../providers/social/InstagramBrowserPublisher';
import { 
  PublishJob, 
  PublishJobStatus, 
  AutomationLogEvent, 
  AutomationEventType,
  Concept,
  MediaAsset 
} from '../models/types';
import { ImageValidator } from './ImageValidator';
import { localBrowserManager } from './browser/LocalBrowserManager';
import { chatGPTBrowserConnector } from './browser/ChatGPTBrowserConnector';
import { instagramBrowserConnector } from './browser/InstagramBrowserConnector';
import { automationReadinessGate } from './browser/AutomationReadinessGate';

export interface OrchestratorSummary {
  runtimeStatus: 'RUNNING' | 'PAUSED' | 'STOPPED';
  isTestMode: boolean;
  browserStatus: string;
  instagramStatus: string;
  currentJob?: PublishJob;
  queueSize: number;
  todayStats: {
    totalScheduled: number;
    published: number;
    failed: number;
    waiting: number;
    actionRequired: number;
  };
  nextJobs: PublishJob[];
  activityLogs: AutomationLogEvent[];
}

export class AutomationOrchestratorService {
  private runtimeStatus: 'RUNNING' | 'PAUSED' | 'STOPPED' = 'RUNNING';
  private isTestMode = true;
  private workerInterval: any = null;
  private activeJobId: string | null = null;
  private isProcessing = false;

  constructor() {
    this.recoverInterruptedJobs();
    this.startWorker();
  }

  public getRuntimeStatus(): 'RUNNING' | 'PAUSED' | 'STOPPED' {
    return this.runtimeStatus;
  }

  public getIsTestMode(): boolean {
    return this.isTestMode;
  }

  public setTestMode(isTest: boolean): void {
    this.isTestMode = isTest;
    this.logEvent('AUTOMATION_STARTED', `Toggled test mode: ${isTest ? 'SAFE TEST MODE' : 'REAL PRODUCTION MODE'}`);
  }

  public startWorker(): void {
    if (this.workerInterval) return;
    this.runtimeStatus = 'RUNNING';
    this.logEvent('AUTOMATION_STARTED', 'Local Automation Orchestrator started.');
    
    // Continuous background worker cycle checking for eligible jobs
    this.workerInterval = setInterval(() => {
      this.tickWorker();
    }, 1500);
  }

  public pauseWorker(): void {
    this.runtimeStatus = 'PAUSED';
    this.logEvent('AUTOMATION_PAUSED', 'Local Automation Orchestrator paused.');
  }

  public resumeWorker(): void {
    this.runtimeStatus = 'RUNNING';
    this.logEvent('AUTOMATION_RESUMED', 'Local Automation Orchestrator resumed.');
  }

  public stopWorker(): void {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
    this.runtimeStatus = 'STOPPED';
    this.logEvent('AUTOMATION_STOPPED', 'Local Automation Orchestrator stopped.');
  }

  /**
   * Log structured automation event to database
   */
  public logEvent(eventType: AutomationEventType, message: string, jobId?: string, details?: string): void {
    localDb.addAutomationLog({
      eventType,
      message,
      jobId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Enqueues an approved concept into the durable job queue
   */
  public enqueueConcept(conceptId: string, options: { scheduledAt?: string; isTestMode?: boolean } = {}): PublishJob {
    const concept = localDb.getConcepts().find(c => c.id === conceptId);
    if (!concept) throw new Error('Concept not found.');

    // Human Safety Gate Check (Section 7 & 9)
    if (concept.status !== 'approved' && concept.status !== 'scheduled') {
      throw new Error(`Human Safety Gate Violation: Cannot enqueue concept with status "${concept.status}". Only approved concepts can enter the publishing queue.`);
    }

    if (!concept.attachedMediaId && !concept.visualUrl) {
      throw new Error('Human Safety Gate Violation: Concept has no generated image asset.');
    }

    const idempotencyToken = `idemp_ig_${concept.id}`;
    const existingJobs = localDb.getPublishJobs();
    let job = existingJobs.find(j => j.conceptId === concept.id);

    if (!job) {
      const jobId = `pub_job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      job = {
        id: jobId,
        publishJobId: jobId,
        conceptId: concept.id,
        mediaId: concept.attachedMediaId || 'media_asset',
        platform: 'instagram',
        accountId: 'soc_insta_1',
        scheduledAt: options.scheduledAt || concept.scheduledDate || new Date().toISOString(),
        caption: concept.fullCaption || concept.hook,
        status: 'QUEUED',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        idempotencyToken,
        isTestMode: options.isTestMode !== undefined ? options.isTestMode : this.isTestMode
      };
    } else {
      job.status = 'QUEUED';
      job.updatedAt = new Date().toISOString();
    }

    localDb.savePublishJob(job);
    this.logEvent('JOB_QUEUED', `Queued post job for concept "${concept.title}"`, job.id);
    return job;
  }

  /**
   * Enqueues a batch of approved concepts
   */
  public enqueueBatch(conceptIds: string[]): PublishJob[] {
    const jobs: PublishJob[] = [];
    for (const id of conceptIds) {
      try {
        const j = this.enqueueConcept(id);
        jobs.push(j);
      } catch (e: any) {
        console.warn(`Skipping concept ${id}: ${e.message}`);
      }
    }
    return jobs;
  }

  /**
   * Restart Recovery: Recovers jobs that were RUNNING/UPLOADING/PUBLISHING when process exited
   */
  public recoverInterruptedJobs(): void {
    const jobs = localDb.getPublishJobs();
    const activeStates: PublishJobStatus[] = ['RUNNING', 'UPLOADING', 'PUBLISHING', 'VERIFYING'];

    jobs.forEach(job => {
      if (activeStates.includes(job.status)) {
        if (job.status === 'PUBLISHED') return;

        // Check if publication reference exists
        if (job.platformReference) {
          job.status = 'PUBLISHED';
          job.verificationStatus = 'VERIFIED';
          localDb.savePublishJob(job);
          this.logEvent('AUTOMATION_RECOVERED', `Recovered completed publish job ${job.id}`, job.id);
        } else {
          job.status = 'UNKNOWN_PUBLISH_STATE';
          job.lastError = 'Job was interrupted during execution. Manual verification required before retry.';
          localDb.savePublishJob(job);
          this.logEvent('AUTOMATION_RECOVERED', `Interrupted job ${job.id} marked UNKNOWN_PUBLISH_STATE`, job.id);
        }
      }
    });
  }

  /**
   * Retries a failed or paused job
   */
  public retryJob(jobId: string): void {
    const job = localDb.getPublishJob(jobId);
    if (!job) return;

    if (job.status === 'PUBLISHED') {
      throw new Error('Duplicate Protection: Cannot retry a job that has already been published.');
    }

    job.status = 'QUEUED';
    job.attempts = 0;
    job.nextRetryAt = undefined;
    job.updatedAt = new Date().toISOString();
    localDb.savePublishJob(job);

    this.logEvent('JOB_QUEUED', `Retrying job ${job.id} for concept "${job.conceptId}"`, job.id);
  }

  /**
   * Resolves an ACTION_REQUIRED state on a job and resumes automation worker
   */
  public resolveActionRequired(jobId: string): void {
    const job = localDb.getPublishJob(jobId);
    if (!job) return;
    job.status = 'QUEUED';
    job.updatedAt = new Date().toISOString();
    localDb.savePublishJob(job);
    this.resumeWorker();
    this.logEvent('SESSION_READY', `Action required resolved manually for job ${job.id}. Resuming automation orchestrator.`, job.id);
  }

  /**
   * Single Tick Worker Execution Cycle
   */
  private async tickWorker(): Promise<void> {
    if (this.runtimeStatus !== 'RUNNING' || this.isProcessing) return;

    const jobs = localDb.getPublishJobs();
    const nowISO = new Date().toISOString();

    // 1. Find next eligible job
    const eligibleJob = jobs.find(job => {
      if (job.status === 'QUEUED') return true;
      if (job.status === 'SCHEDULED' && job.scheduledAt <= nowISO) return true;
      if (job.status === 'RETRY_WAIT' && job.nextRetryAt && job.nextRetryAt <= nowISO) return true;
      return false;
    });

    if (!eligibleJob) return;

    this.isProcessing = true;
    this.activeJobId = eligibleJob.id;

    try {
      await this.processJob(eligibleJob);
    } catch (err: any) {
      console.error(`Worker error processing job ${eligibleJob.id}:`, err);
    } finally {
      this.isProcessing = false;
      this.activeJobId = null;
    }
  }

  /**
   * Processes a single job through the state machine
   */
  private async processJob(job: PublishJob): Promise<void> {
    const startTime = Date.now();
    job.startedAt = new Date().toISOString();
    job.attempts += 1;
    job.status = 'RUNNING';
    localDb.savePublishJob(job);

    this.logEvent('JOB_STARTED', `Started processing job for concept "${job.conceptId}"`, job.id);

    // 1. Verify Concept & Approval Safety Gate
    const concept = localDb.getConcepts().find(c => c.id === job.conceptId);
    if (!concept || (concept.status !== 'approved' && concept.status !== 'scheduled')) {
      job.status = 'FAILED';
      job.errorCode = 'PERMANENT_SAFETY_VIOLATION';
      job.errorMessage = 'Concept missing or not approved.';
      localDb.savePublishJob(job);
      this.logEvent('JOB_FAILED', `Permanent failure: Concept ${job.conceptId} not approved.`, job.id);
      return;
    }

    // 2. Verify Session & Browser Readiness
    const sessionCheck = await localBrowserBridge.verifySocialBrowserSession(job.platform);
    if (!sessionCheck.authenticated) {
      job.status = 'ACTION_REQUIRED';
      job.errorCode = 'AUTHENTICATION_REQUIRED';
      job.errorMessage = sessionCheck.message;
      localDb.savePublishJob(job);
      this.pauseWorker();
      this.logEvent('ACTION_REQUIRED', `Paused: Authentication required for ${job.platform}.`, job.id);
      return;
    }

    // 3. Transition to UPLOADING
    job.status = 'UPLOADING';
    localDb.savePublishJob(job);
    this.logEvent('UPLOAD_STARTED', `Navigating DOM and selecting media for "${concept.title}"`, job.id);

    // 4. Handoff to InstagramBrowserPublisher
    job.status = 'PUBLISHING';
    localDb.savePublishJob(job);
    this.logEvent('PUBLISH_STARTED', `Inserting approved caption and building post preview`, job.id);

    const isTest = job.isTestMode !== undefined ? job.isTestMode : this.isTestMode;
    const pubRes = await instagramBrowserPublisher.publishToInstagram(job.conceptId, { isTestMode: isTest });

    // 5. Evaluate Result
    job.completedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();

    if (pubRes.success) {
      if (isTest) {
        job.status = 'READY_TO_PUBLISH';
        job.verificationStatus = 'VERIFIED';
        this.logEvent('PUBLISH_VERIFIED', `TEST MODE VERIFIED: Post prepared & verified for "${concept.title}". Stopped before final publish.`, job.id);
      } else {
        job.status = 'PUBLISHED';
        job.publishedAt = new Date().toISOString();
        job.platformReference = pubRes.platformReference;
        job.verificationStatus = 'VERIFIED';
        this.logEvent('PUBLISH_COMPLETED', `REAL POST PUBLISHED: Verified Instagram publication for "${concept.title}". Ref: ${pubRes.platformReference}`, job.id);
      }
      localDb.savePublishJob(job);
    } else {
      // Failure Handling & Exponential Backoff Retry (Section 7)
      const isTransient = pubRes.error?.includes('timeout') || pubRes.error?.includes('temporary');
      if (isTransient && job.attempts < job.maxAttempts) {
        job.status = 'RETRY_WAIT';
        const backoffMs = Math.pow(2, job.attempts) * 5000;
        job.nextRetryAt = new Date(Date.now() + backoffMs).toISOString();
        job.lastError = pubRes.error;
        localDb.savePublishJob(job);
        this.logEvent('JOB_RETRY_SCHEDULED', `Transient failure: Retry #${job.attempts} scheduled in ${backoffMs / 1000}s`, job.id);
      } else {
        job.status = 'FAILED';
        job.errorCode = 'PUBLISH_FAILED';
        job.errorMessage = pubRes.error || 'Publishing failed.';
        localDb.savePublishJob(job);
        this.logEvent('JOB_FAILED', `Job failed: ${pubRes.error}`, job.id);
      }
    }
  }

  /**
   * Returns complete summary payload for Automation Dashboard (Section 10)
   */
  public getOrchestratorSummary(): OrchestratorSummary {
    const jobs = localDb.getPublishJobs();
    const concepts = localDb.getConcepts();
    const logs = localDb.getAutomationLogs();
    const aiConn = localDb.getAIConnection();

    const activeJob = jobs.find(j => j.id === this.activeJobId || j.status === 'RUNNING' || j.status === 'UPLOADING' || j.status === 'PUBLISHING');
    const queue = jobs.filter(j => j.status === 'QUEUED' || j.status === 'SCHEDULED' || j.status === 'RETRY_WAIT');

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayJobs = jobs.filter(j => j.createdAt && j.createdAt.startsWith(todayStr));

    const browserStatus = localBrowserManager.getStatus();
    const instaState = instagramBrowserConnector.getState();

    return {
      runtimeStatus: this.runtimeStatus,
      isTestMode: this.isTestMode,
      browserStatus: browserStatus.isProcessRunning ? 'Connected' : 'Not Connected',
      instagramStatus: instaState.isReady ? 'Authenticated' : instaState.status === 'INSTAGRAM_LOGIN_REQUIRED' ? 'Login Required' : 'Action Required',
      currentJob: activeJob,
      queueSize: queue.length,
      todayStats: {
        totalScheduled: todayJobs.length,
        published: todayJobs.filter(j => j.status === 'PUBLISHED').length,
        failed: todayJobs.filter(j => j.status === 'FAILED' || j.status === 'PUBLISH_FAILED').length,
        waiting: queue.length,
        actionRequired: jobs.filter(j => j.status === 'ACTION_REQUIRED').length
      },
      nextJobs: queue.slice(0, 5),
      activityLogs: logs.slice(0, 15)
    };
  }
}

export const automationOrchestrator = new AutomationOrchestratorService();
