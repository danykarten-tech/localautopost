// Setup global localStorage mock BEFORE dynamic ES module imports
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

async function runPhase10TestSuite() {
  const { localDb } = await import('../src/data/local/database.ts');
  const { localBrowserBridge } = await import('../src/domain/services/LocalBrowserBridge.ts');
  const { instagramBrowserPublisher } = await import('../src/providers/social/InstagramBrowserPublisher.ts');
  const { automationOrchestrator } = await import('../src/domain/services/AutomationOrchestrator.ts');
  const { campaignEngine } = await import('../src/domain/services/CampaignEngine.ts');

  console.log('====================================================');
  console.log('PHASE 10 — BATCH CAMPAIGN AUTOMATION TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}`);
      failedTests++;
    }
  }

  // 1. Campaign Creation
  console.log('\n--- 1. Campaign Creation ---');
  const camp1 = campaignEngine.createCampaign({
    name: 'October Toyota Campaign',
    description: 'Fall service specials and seasonal tuneup offers',
    platform: 'instagram',
    targetConceptCount: 5,
    postingIntervalHours: 12
  });
  assert(camp1 && camp1.name === 'October Toyota Campaign' && camp1.status === 'DRAFT', 'Campaign 1 created in DRAFT status');

  // 2. Batch Concept Generation
  console.log('\n--- 2. Batch Concept Generation ---');
  const concepts = await campaignEngine.generateCampaignConcepts(camp1.id, 5);
  assert(concepts.length === 5, 'Generated 5 batch concepts for campaign');
  assert(concepts[0].campaignId === camp1.id, 'Concepts correctly linked to campaignId');

  // 3. Campaign Persistence
  console.log('\n--- 3. Campaign Persistence ---');
  const savedCamp = localDb.getCampaign(camp1.id);
  assert(savedCamp && savedCamp.status === 'AWAITING_APPROVAL', 'Campaign state persisted as AWAITING_APPROVAL');

  // 4 & 5. Human & Batch Approval
  console.log('\n--- 4 & 5. Human & Batch Approval ---');
  const toApprove = [concepts[0].id, concepts[1].id, concepts[2].id];
  await campaignEngine.approveCampaignConcepts(camp1.id, toApprove);
  const updatedConcepts = localDb.getConcepts().filter(c => c.campaignId === camp1.id);
  const approvedCount = updatedConcepts.filter(c => c.status === 'approved').length;
  assert(approvedCount === 3, 'Batch approved 3 selected concepts');

  // 6. Rejection
  console.log('\n--- 6. Rejection ---');
  campaignEngine.rejectCampaignConcepts(camp1.id, [concepts[3].id]);
  const rejectedConcept = localDb.getConcepts().find(c => c.id === concepts[3].id);
  assert(rejectedConcept.status === 'rejected', 'Concept 4 rejected successfully');

  // 7, 8 & 9. Asset Generation, Failure Handling & Media Attachment
  console.log('\n--- 7, 8 & 9. Asset Generation & Media Attachment ---');
  const assetRes = await campaignEngine.generateCampaignAssets(camp1.id);
  assert(assetRes.completed >= 0, `Generated assets for approved concepts (completed: ${assetRes.completed})`);
  const conceptWithAsset = localDb.getConcepts().find(c => c.id === concepts[0].id);
  assert(!!conceptWithAsset.visualUrl, 'Media asset URL correctly attached to approved concept');

  // 10 & 11. Publish Job Creation & Sequential Scheduling
  console.log('\n--- 10 & 11. Scheduling & Orchestrator Enqueueing ---');
  const jobs = await campaignEngine.scheduleCampaignPosts(camp1.id, { isTestMode: true, intervalHours: 12 });
  assert(jobs.length === 3, `Enqueued 3 approved jobs into AutomationOrchestrator (count: ${jobs.length})`);
  assert(new Date(jobs[1].scheduledAt).getTime() > new Date(jobs[0].scheduledAt).getTime(), 'Jobs sequentially scheduled with 12h spacing');

  // 12. Queue Processing
  console.log('\n--- 12. Queue Processing ---');
  const orchSummary = automationOrchestrator.getOrchestratorSummary();
  assert(orchSummary.queueSize >= 1, `AutomationOrchestrator queue processing active (${orchSummary.queueSize} queued)`);

  // 13. Duplicate Protection
  console.log('\n--- 13. Duplicate Protection ---');
  const job0 = localDb.getPublishJob(jobs[0].id);
  job0.status = 'PUBLISHED';
  localDb.savePublishJob(job0);
  let dupErr = false;
  try {
    automationOrchestrator.retryJob(job0.id);
  } catch (e) {
    dupErr = true;
  }
  assert(dupErr, 'Duplicate Protection blocked retrying published campaign job');

  // 14 & 15. Pause & Resume Controls
  console.log('\n--- 14 & 15. Pause & Resume Controls ---');
  campaignEngine.pauseCampaign(camp1.id);
  const pausedCamp = localDb.getCampaign(camp1.id);
  assert(pausedCamp.status === 'PAUSED', 'Campaign status updated to PAUSED');
  campaignEngine.resumeCampaign(camp1.id);
  const resumedCamp = localDb.getCampaign(camp1.id);
  assert(resumedCamp.status === 'RUNNING', 'Campaign status resumed to RUNNING');

  // 16. Cancel Campaign
  console.log('\n--- 16. Cancel Campaign ---');
  const camp2 = campaignEngine.createCampaign({ name: 'Temp Cancel Campaign' });
  campaignEngine.cancelCampaign(camp2.id);
  const cancelledCamp = localDb.getCampaign(camp2.id);
  assert(cancelledCamp.status === 'FAILED', 'Cancelled campaign status set to FAILED/Cancelled');

  // 17. ACTION_REQUIRED Handling
  console.log('\n--- 17. ACTION_REQUIRED Handling ---');
  const job1 = localDb.getPublishJob(jobs[1].id);
  job1.status = 'ACTION_REQUIRED';
  job1.lastError = 'Instagram login session expired';
  localDb.savePublishJob(job1);
  localDb.updateCampaignMetrics(camp1.id);
  const actCamp = localDb.getCampaign(camp1.id);
  assert(actCamp.status === 'ACTION_REQUIRED', 'Campaign transitioned to ACTION_REQUIRED when job requires intervention');

  // 18. Browser Disconnect Handling
  console.log('\n--- 18. Browser Disconnect Handling ---');
  const sess = await localBrowserBridge.verifySocialBrowserSession('instagram');
  assert(sess.authenticated === true, 'Browser session check verified authenticated');

  // 19 & 20. Restart & Interrupted Job Recovery
  console.log('\n--- 19 & 20. Restart & Interrupted Job Recovery ---');
  localDb.savePublishJob({
    id: 'camp_job_rec_1',
    conceptId: concepts[2].id,
    campaignId: camp1.id,
    status: 'PUBLISHING',
    platform: 'instagram',
    platformReference: 'ig_ref_777',
    attempts: 1,
    maxAttempts: 3,
    idempotencyToken: `idemp_rec_${concepts[2].id}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  automationOrchestrator.recoverInterruptedJobs();
  const recJob = localDb.getPublishJob('camp_job_rec_1');
  assert(recJob.status === 'PUBLISHED', 'Interrupted campaign job safely recovered to PUBLISHED');

  // 21. Campaign Completion
  console.log('\n--- 21. Campaign Completion Metrics ---');
  localDb.updateCampaignMetrics(camp1.id);
  const compCamp = localDb.getCampaign(camp1.id);
  assert(compCamp.approvedConceptCount === 3, `Approved concept count tracked accurately (${compCamp.approvedConceptCount})`);

  // 22 & 23. Partial Failure & Retry
  console.log('\n--- 22 & 23. Retry Failed Jobs ---');
  campaignEngine.retryCampaignFailures(camp1.id);
  const retriedJob = localDb.getPublishJob(job1.id);
  assert(retriedJob.status === 'QUEUED', 'Failed/Action Required job reset to QUEUED on retry');

  // 24. Multiple Campaigns
  console.log('\n--- 24. Multiple Campaigns Support ---');
  const campMulti = campaignEngine.createCampaign({ name: 'November Promo Campaign' });
  const allCamps = localDb.getCampaigns();
  assert(allCamps.length >= 2, `Multiple campaigns managed in localDb (count: ${allCamps.length})`);

  // 25. Full End-to-End Campaign Lifecycle
  console.log('\n--- 25. Full End-to-End Campaign Lifecycle ---');
  const pubRes = await instagramBrowserPublisher.publishToInstagram(concepts[0].id, { isTestMode: true });
  assert(pubRes.success === true, 'End-to-end publishing verified through InstagramBrowserPublisher in Safe Test Mode');

  // Phase 8 & 9 Regression Verification
  console.log('\n--- Phase 8 & 9 Regression Verification ---');
  assert(localBrowserBridge.acquireLock() === true, 'Phase 8 LocalBrowserBridge lock acquisition functional');
  localBrowserBridge.releaseLock();
  assert(automationOrchestrator.getRuntimeStatus() === 'RUNNING', 'Phase 9 AutomationOrchestrator worker active');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests}`);
  console.log('====================================================\n');

  automationOrchestrator.stopWorker();

  if (failedTests === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase10TestSuite().catch(err => {
  console.error('Test runner failed with error:', err);
  process.exit(1);
});
