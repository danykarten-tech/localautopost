import { localBrowserManager } from './LocalBrowserManager';
import { chatGPTBrowserConnector } from './ChatGPTBrowserConnector';
import { instagramBrowserConnector } from './InstagramBrowserConnector';
import { localDb } from '../../../data/local/database';

export interface ReadinessEvaluation {
  isReady: boolean;
  reasons: string[];
  checks: {
    browser: boolean;
    profile: boolean;
    chatgpt: boolean;
    instagram: boolean;
    conceptApproved: boolean;
    assetExists: boolean;
    idempotencyValid: boolean;
  };
}

export class AutomationReadinessGate {
  /**
   * Evaluates publish readiness for a specific concept/job
   */
  public async evaluatePublishingReadiness(conceptId: string): Promise<ReadinessEvaluation> {
    const reasons: string[] = [];
    const checks = {
      browser: false,
      profile: false,
      chatgpt: false,
      instagram: false,
      conceptApproved: false,
      assetExists: false,
      idempotencyValid: true
    };

    // 1. Browser Process & Profile Check
    const browserStatus = localBrowserManager.getStatus();
    checks.profile = !!browserStatus.profilePath;
    checks.browser = browserStatus.isProcessRunning;

    if (!checks.browser) {
      reasons.push('Local browser process is offline. Please launch browser in Connection Center.');
    }

    // 2. Real Instagram Session Check
    const instaState = await instagramBrowserConnector.checkSession().catch(() => instagramBrowserConnector.getState());
    checks.instagram = instaState.isReady;

    if (!checks.instagram) {
      reasons.push(`Instagram session is not ready (Status: ${instaState.status}). Manual login required.`);
    }

    // 3. Real ChatGPT Session Check (optional for publishing, required for creation)
    const cgState = chatGPTBrowserConnector.getState();
    checks.chatgpt = cgState.isReady;

    // 4. Concept Approval Check (Human Safety Gate)
    const concept = localDb.getConcepts().find(c => c.id === conceptId);
    if (!concept) {
      reasons.push(`Concept ${conceptId} not found in database.`);
    } else {
      if (concept.status === 'approved' || concept.status === 'scheduled') {
        checks.conceptApproved = true;
      } else {
        reasons.push(`Human Safety Gate Violation: Concept status is "${concept.status}". Only approved content can be published.`);
      }

      // 5. Image Asset Check
      if (concept.attachedMediaId || concept.visualUrl) {
        checks.assetExists = true;
      } else {
        reasons.push('Human Safety Gate Violation: Concept has no generated image asset attached.');
      }
    }

    // 6. Idempotency Protection Check
    const existingJob = localDb.getPublishJobs().find(j => j.conceptId === conceptId);
    if (existingJob && existingJob.status === 'PUBLISHED') {
      checks.idempotencyValid = false;
      reasons.push('Duplicate Protection: Concept has already been published.');
    }

    const isReady = checks.browser && checks.instagram && checks.conceptApproved && checks.assetExists && checks.idempotencyValid;

    return {
      isReady,
      reasons,
      checks
    };
  }

  /**
   * Evaluates content generation readiness
   */
  public async evaluateGenerationReadiness(): Promise<ReadinessEvaluation> {
    const reasons: string[] = [];
    const checks = {
      browser: false,
      profile: false,
      chatgpt: false,
      instagram: false,
      conceptApproved: true,
      assetExists: true,
      idempotencyValid: true
    };

    const browserStatus = localBrowserManager.getStatus();
    checks.browser = browserStatus.isProcessRunning;
    checks.profile = !!browserStatus.profilePath;

    if (!checks.browser) {
      reasons.push('Local browser process is offline.');
    }

    const cgState = await chatGPTBrowserConnector.checkSession().catch(() => chatGPTBrowserConnector.getState());
    checks.chatgpt = cgState.isReady;

    if (!checks.chatgpt) {
      reasons.push(`ChatGPT session is not ready (Status: ${cgState.status}). Manual login required.`);
    }

    return {
      isReady: checks.browser && checks.chatgpt,
      reasons,
      checks
    };
  }
}

export const automationReadinessGate = new AutomationReadinessGate();
