import { localDb } from '../../data/local/database';
import { contentEngine } from './ContentEngine';
import { imageEngine } from './ImageEngine';
import { automationOrchestrator } from './AutomationOrchestrator';
import { 
  Campaign, 
  CampaignStatus, 
  Concept, 
  PublishJob, 
  PlatformType, 
  ContentObjective 
} from '../models/types';

export class CampaignEngineService {
  /**
   * Creates a new campaign record
   */
  public createCampaign(params: {
    name: string;
    description?: string;
    platform?: PlatformType;
    objective?: ContentObjective;
    targetConceptCount?: number;
    startDate?: string;
    postingIntervalHours?: number;
  }): Campaign {
    const workspace = localDb.getWorkspace();
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const campaign: Campaign = {
      id: campaignId,
      workspaceId: workspace.id,
      name: params.name || 'Untitled Campaign',
      description: params.description || '',
      platform: params.platform || 'instagram',
      objective: params.objective || 'Brand Awareness',
      targetConceptCount: params.targetConceptCount || 10,
      approvedConceptCount: 0,
      generatedAssetCount: 0,
      scheduledPostCount: 0,
      publishedPostCount: 0,
      failedPostCount: 0,
      status: 'DRAFT',
      startDate: params.startDate || new Date().toISOString(),
      postingIntervalHours: params.postingIntervalHours || 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localDb.saveCampaign(campaign);
    localDb.logActivity('concept_generated', 'Campaign Created', `Created campaign "${campaign.name}" for target ${campaign.targetConceptCount} concepts.`);
    return campaign;
  }

  /**
   * Generates a batch of content concepts for a campaign
   */
  public async generateCampaignConcepts(
    campaignId: string,
    count?: number,
    onProgress?: (progress: any) => void
  ): Promise<Concept[]> {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found.');

    const targetQty = count || campaign.targetConceptCount || 10;
    campaign.status = 'GENERATING_CONCEPTS';
    localDb.saveCampaign(campaign);

    try {
      const { concepts } = await contentEngine.startGenerationBatch(
        {
          id: `req_${Date.now()}`,
          workspaceId: campaign.workspaceId,
          platform: campaign.platform,
          objective: campaign.objective,
          topic: campaign.name,
          quantity: targetQty,
          tone: 'Professional & Engaging',
          style: 'Minimal',
          additionalInstructions: campaign.description,
          generationBatchId: campaign.id,
          createdAt: new Date().toISOString()
        },
        onProgress
      );

      // Link concepts to campaignId
      concepts.forEach(c => {
        c.campaignId = campaign.id;
        localDb.updateConceptDetails(c.id, { campaignId: campaign.id });
      });

      campaign.status = 'AWAITING_APPROVAL';
      localDb.saveCampaign(campaign);
      localDb.updateCampaignMetrics(campaign.id);
      return concepts;
    } catch (err: any) {
      campaign.status = 'FAILED';
      campaign.lastError = err.message;
      localDb.saveCampaign(campaign);
      throw err;
    }
  }

  /**
   * Batch approve selected concepts for a campaign
   */
  public async approveCampaignConcepts(campaignId: string, conceptIds: string[]): Promise<void> {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found.');

    const concepts = localDb.getConcepts().filter(c => conceptIds.includes(c.id));
    for (const concept of concepts) {
      concept.status = 'approved';
      concept.updatedAt = new Date().toISOString();
      localDb.updateConceptDetails(concept.id, { status: 'approved' });
    }

    localDb.updateCampaignMetrics(campaign.id);
    localDb.logActivity('approved', 'Concepts Approved', `Approved ${conceptIds.length} concept(s) in campaign "${campaign.name}".`);
  }

  /**
   * Batch reject selected concepts for a campaign
   */
  public rejectCampaignConcepts(campaignId: string, conceptIds: string[]): void {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found.');

    const concepts = localDb.getConcepts().filter(c => conceptIds.includes(c.id));
    for (const concept of concepts) {
      concept.status = 'rejected';
      concept.updatedAt = new Date().toISOString();
      localDb.updateConceptDetails(concept.id, { status: 'rejected' });
    }

    localDb.updateCampaignMetrics(campaign.id);
    localDb.logActivity('rejected', 'Concepts Rejected', `Rejected ${conceptIds.length} concept(s) in campaign "${campaign.name}".`);
  }

  /**
   * Generates missing image assets for all approved concepts in a campaign
   */
  public async generateCampaignAssets(
    campaignId: string,
    onProgress?: (completed: number, total: number, failed: number) => void
  ): Promise<{ completed: number; failedIds: string[] }> {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found.');

    const approvedConcepts = localDb.getConcepts().filter(
      c => (c.campaignId === campaignId || c.generationBatchId === campaignId) && 
           c.status === 'approved' && 
           !c.attachedMediaId && 
           !c.visualUrl
    );

    if (approvedConcepts.length === 0) {
      campaign.status = 'READY_TO_SCHEDULE';
      localDb.saveCampaign(campaign);
      return { completed: 0, failedIds: [] };
    }

    campaign.status = 'GENERATING_ASSETS';
    localDb.saveCampaign(campaign);

    const conceptIds = approvedConcepts.map(c => c.id);
    const res = await imageEngine.bulkGenerateImages(conceptIds, onProgress);

    campaign.status = 'READY_TO_SCHEDULE';
    localDb.updateCampaignMetrics(campaign.id);
    return { completed: res.completedCount, failedIds: res.failedIds };
  }

  /**
   * Schedules approved concepts into the AutomationOrchestrator queue with post interval spacing
   */
  public async scheduleCampaignPosts(
    campaignId: string,
    options: { startDate?: string; intervalHours?: number; isTestMode?: boolean } = {}
  ): Promise<PublishJob[]> {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found.');

    const approvedConcepts = localDb.getConcepts().filter(
      c => (c.campaignId === campaignId || c.generationBatchId === campaignId) && 
           c.status === 'approved' && 
           (!!c.attachedMediaId || !!c.visualUrl)
    );

    if (approvedConcepts.length === 0) {
      throw new Error('Human Safety Gate Violation: No approved concepts with valid image assets available to schedule.');
    }

    const intervalHours = options.intervalHours || campaign.postingIntervalHours || 24;
    let baseTime = options.startDate ? new Date(options.startDate).getTime() : Date.now();

    const jobs: PublishJob[] = [];
    approvedConcepts.forEach((concept, index) => {
      const scheduledTimeMs = baseTime + (index * intervalHours * 3600 * 1000);
      const scheduledAt = new Date(scheduledTimeMs).toISOString();

      const job = automationOrchestrator.enqueueConcept(concept.id, {
        scheduledAt,
        isTestMode: options.isTestMode
      });

      job.campaignId = campaignId;
      localDb.savePublishJob(job);

      // Update concept status to scheduled
      concept.status = 'scheduled';
      concept.scheduledDate = scheduledAt.slice(0, 10);
      concept.scheduledTime = new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localDb.updateConceptDetails(concept.id, {
        status: 'scheduled',
        scheduledDate: concept.scheduledDate,
        scheduledTime: concept.scheduledTime
      });

      jobs.push(job);
    });

    campaign.status = 'RUNNING';
    localDb.updateCampaignMetrics(campaign.id);
    localDb.logActivity('scheduled', 'Campaign Scheduled', `Enqueued ${jobs.length} post(s) into automation orchestrator for "${campaign.name}".`);

    return jobs;
  }

  /**
   * Complete End-to-End Automated Campaign Pipeline Workflow:
   * Batch Approve -> Generate Assets -> Schedule & Enqueue with Orchestrator
   */
  public async executeBatchCampaignWorkflow(
    campaignId: string,
    conceptIds: string[],
    options: { startDate?: string; intervalHours?: number; isTestMode?: boolean } = {}
  ): Promise<PublishJob[]> {
    // 1. Batch Approve
    await this.approveCampaignConcepts(campaignId, conceptIds);

    // 2. Generate Assets
    await this.generateCampaignAssets(campaignId);

    // 3. Schedule & Enqueue with AutomationOrchestrator
    const jobs = await this.scheduleCampaignPosts(campaignId, options);

    return jobs;
  }

  /**
   * Pause campaign execution
   */
  public pauseCampaign(campaignId: string): void {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) return;

    campaign.status = 'PAUSED';
    localDb.saveCampaign(campaign);

    // Pause matching queued jobs
    const jobs = localDb.getPublishJobs().filter(j => j.campaignId === campaignId && (j.status === 'QUEUED' || j.status === 'SCHEDULED'));
    jobs.forEach(j => {
      j.status = 'PAUSED';
      localDb.savePublishJob(j);
    });

    localDb.logActivity('automation_triggered', 'Campaign Paused', `Paused automation execution for campaign "${campaign.name}".`);
  }

  /**
   * Resume campaign execution
   */
  public resumeCampaign(campaignId: string): void {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) return;

    campaign.status = 'RUNNING';
    localDb.saveCampaign(campaign);

    // Resume matching paused jobs
    const jobs = localDb.getPublishJobs().filter(j => j.campaignId === campaignId && j.status === 'PAUSED');
    jobs.forEach(j => {
      j.status = 'QUEUED';
      localDb.savePublishJob(j);
    });

    automationOrchestrator.resumeWorker();
    localDb.logActivity('automation_triggered', 'Campaign Resumed', `Resumed automation execution for campaign "${campaign.name}".`);
  }

  /**
   * Cancel campaign
   */
  public cancelCampaign(campaignId: string): void {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) return;

    campaign.status = 'FAILED';
    campaign.lastError = 'Campaign cancelled by user.';
    localDb.saveCampaign(campaign);

    const jobs = localDb.getPublishJobs().filter(j => j.campaignId === campaignId && j.status !== 'PUBLISHED');
    jobs.forEach(j => {
      j.status = 'CANCELLED';
      localDb.savePublishJob(j);
    });

    localDb.logActivity('automation_triggered', 'Campaign Cancelled', `Cancelled queued/scheduled jobs for campaign "${campaign.name}".`);
  }

  /**
   * Retries failed jobs for a campaign
   */
  public retryCampaignFailures(campaignId: string): void {
    const campaign = localDb.getCampaign(campaignId);
    if (!campaign) return;

    const failedJobs = localDb.getPublishJobs().filter(j => j.campaignId === campaignId && (j.status === 'FAILED' || j.status === 'PUBLISH_FAILED' || j.status === 'ACTION_REQUIRED'));
    failedJobs.forEach(job => {
      automationOrchestrator.retryJob(job.id);
    });

    campaign.status = 'RUNNING';
    localDb.updateCampaignMetrics(campaign.id);
    localDb.logActivity('automation_triggered', 'Campaign Retried', `Retrying ${failedJobs.length} failed job(s) for campaign "${campaign.name}".`);
  }
}

export const campaignEngine = new CampaignEngineService();
