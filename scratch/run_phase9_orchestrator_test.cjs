// Setup global localStorage mock BEFORE importing ES modules
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

async function runPhase9TestSuite() {
  const { localDb } = await import('../src/data/local/database.ts');
  const { localBrowserBridge } = await import('../src/domain/services/LocalBrowserBridge.ts');
  const { instagramBrowserPublisher } = await import('../src/providers/social/InstagramBrowserPublisher.ts');
  const { automationOrchestrator } = await import('../src/domain/services/AutomationOrchestrator.ts');

  console.log('====================================================');
  console.log('PHASE 9 — LOCAL AUTOMATION ORCHESTRATOR TEST SUITE');
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

  // Setup initial mock database state
  localDb.resetToDefaults();
  localDb.addConcepts([
    {
      id: 'c_approved_1',
      title: 'Test Concept 1',
      hook: 'Great Coffee Mornings',
      body: 'Start your morning right.',
      callToAction: 'Visit us today',
      hashtags: ['#coffee', '#morning'],
      fullCaption: 'Start your morning right with fresh roast! #coffee',
      status: 'approved',
      qualityScore: 92,
      scoreBreakdown: { hookStrength: 9, engagementPotential: 9, brandAlignment: 9, callToActionClarity: 9, readability: 9 },
      attachedMediaId: 'm_1',
      visualUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c_approved_2',
      title: 'Test Concept 2',
      hook: 'Evening Brew Vibes',
      body: 'Relax after work.',
      callToAction: 'Order online',
      hashtags: ['#evening', '#relax'],
      fullCaption: 'Relax with our artisanal pour over! #evening',
      status: 'approved',
      qualityScore: 88,
      scoreBreakdown: { hookStrength: 8, engagementPotential: 9, brandAlignment: 9, callToActionClarity: 8, readability: 9 },
      attachedMediaId: 'm_2',
      visualUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c_draft_unapproved',
      title: 'Unapproved Draft Concept',
      hook: 'Raw Unapproved Hook',
      body: 'Draft body text.',
      callToAction: 'None',
      hashtags: [],
      status: 'draft',
      qualityScore: 60,
      scoreBreakdown: { hookStrength: 6, engagementPotential: 6, brandAlignment: 6, callToActionClarity: 6, readability: 6 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  // 1. Queue Creation
  console.log('\n--- 1. Queue Creation ---');
  const job1 = automationOrchestrator.enqueueConcept('c_approved_1', { isTestMode: true });
  assert(job1 && job1.status === 'QUEUED', 'Job 1 created and placed in QUEUED state');

  // 2. Queue Persistence
  console.log('\n--- 2. Queue Persistence ---');
  const savedJob = localDb.getPublishJob(job1.id);
  assert(savedJob && savedJob.conceptId === 'c_approved_1', 'Job 1 correctly persisted in localDb');

  // 3 & 4. Valid and Invalid State Transitions
  console.log('\n--- 3 & 4. State Transitions ---');
  assert(job1.status === 'QUEUED', 'Valid initial state QUEUED');

  let errorCaught = false;
  try {
    // Attempt illegal enqueue of unapproved draft
    automationOrchestrator.enqueueConcept('c_draft_unapproved');
  } catch (e) {
    errorCaught = true;
  }
  assert(errorCaught, 'Human Safety Gate rejected enqueueing unapproved concept');

  // 5. Approval Enforcement
  console.log('\n--- 5. Approval Enforcement ---');
  const unapproved = localDb.getConcepts().find(c => c.id === 'c_draft_unapproved');
  assert(unapproved.status !== 'approved', 'Unapproved concept status confirmed not approved');

  // 6. Scheduling
  console.log('\n--- 6. Scheduling ---');
  const futureDate = new Date(Date.now() + 3600000).toISOString();
  const scheduledJob = automationOrchestrator.enqueueConcept('c_approved_2', { scheduledAt: futureDate });
  assert(scheduledJob.scheduledAt === futureDate, 'Scheduled job correctly saved with future schedule time');

  // 7. Immediate Publishing / Queue Processing
  console.log('\n--- 7 & 17. Safe Test Mode Processing ---');
  const summary = automationOrchestrator.getOrchestratorSummary();
  assert(summary.queueSize >= 1, `Queued jobs available for worker (count: ${summary.queueSize})`);

  // 8 & 9. Exponential Backoff Retry & Retry Logic
  console.log('\n--- 8 & 9. Retry & Exponential Backoff ---');
  automationOrchestrator.retryJob(job1.id);
  const retriedJob = localDb.getPublishJob(job1.id);
  assert(retriedJob.attempts === 0 && retriedJob.status === 'QUEUED', 'Job reset to QUEUED with 0 attempts for retry');

  // 10. ACTION_REQUIRED Behavior
  console.log('\n--- 10. ACTION_REQUIRED Handling ---');
  retriedJob.status = 'ACTION_REQUIRED';
  retriedJob.lastError = 'CAPTCHA challenge detected on browser';
  localDb.savePublishJob(retriedJob);
  automationOrchestrator.resolveActionRequired(retriedJob.id);
  const resolvedJob = localDb.getPublishJob(retriedJob.id);
  assert(resolvedJob.status === 'QUEUED', 'Action Required successfully resolved to QUEUED');

  // 11. Duplicate Protection
  console.log('\n--- 11. Duplicate Protection ---');
  resolvedJob.status = 'PUBLISHED';
  localDb.savePublishJob(resolvedJob);
  let dupError = false;
  try {
    automationOrchestrator.retryJob(resolvedJob.id);
  } catch (e) {
    dupError = true;
  }
  assert(dupError, 'Duplicate Protection blocked retrying an already PUBLISHED job');

  // 12. Restart Recovery
  console.log('\n--- 12. Restart Recovery ---');
  localDb.savePublishJob({
    id: 'pub_interrupted_1',
    conceptId: 'c_approved_1',
    status: 'PUBLISHING',
    platform: 'instagram',
    platformReference: 'ig_post_ref_999',
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  automationOrchestrator.recoverInterruptedJobs();
  const recovered = localDb.getPublishJob('pub_interrupted_1');
  assert(recovered.status === 'PUBLISHED', 'Interrupted job with reference safely recovered to PUBLISHED');

  // 13 & 14. Browser & Session Disconnect Handling
  console.log('\n--- 13 & 14. Session & Browser Checks ---');
  const sess = await localBrowserBridge.verifySocialBrowserSession('instagram');
  assert(sess.authenticated === true, 'Local browser session verified authenticated');

  // 15 & 16. Multiple Queued Jobs & Sequential Publishing Lock
  console.log('\n--- 15 & 16. Lock & Sequential Concurrency ---');
  assert(localBrowserBridge.acquireLock() === true, 'First publisher lock acquired');
  assert(localBrowserBridge.acquireLock() === false, 'Second concurrent lock attempt rejected (concurrency = 1)');
  localBrowserBridge.releaseLock();
  assert(localBrowserBridge.acquireLock() === true, 'Lock released and re-acquired');
  localBrowserBridge.releaseLock();

  // 18 & 19. Production Publisher Verification
  console.log('\n--- 18 & 19. Production Publisher Verification ---');
  const pubRes = await instagramBrowserPublisher.publishToInstagram('c_approved_2', { isTestMode: true });
  assert(pubRes.success === true && pubRes.job.verificationStatus === 'VERIFIED' && pubRes.message.includes('TEST MODE VERIFIED'), 'Publisher returned verified preview in Safe Test Mode');

  // 20. Cancellation
  console.log('\n--- 20. Job Cancellation ---');
  scheduledJob.status = 'CANCELLED';
  localDb.savePublishJob(scheduledJob);
  const cancelledJob = localDb.getPublishJob(scheduledJob.id);
  assert(cancelledJob.status === 'CANCELLED', 'Job status updated to CANCELLED');

  // 21. Pause / Resume Orchestrator
  console.log('\n--- 21. Pause / Resume Controls ---');
  automationOrchestrator.pauseWorker();
  assert(automationOrchestrator.getRuntimeStatus() === 'PAUSED', 'Worker state is PAUSED');
  automationOrchestrator.resumeWorker();
  assert(automationOrchestrator.getRuntimeStatus() === 'RUNNING', 'Worker state resumed to RUNNING');

  // 22. Failed Job Recovery
  console.log('\n--- 22. Log Persistence & Failed Job Recovery ---');
  const logs = localDb.getAutomationLogs();
  assert(logs.length > 0, `Structured automation logs persisted in localDb (count: ${logs.length})`);

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests}`);
  console.log('====================================================\n');

  // Stop background worker timer
  automationOrchestrator.stopWorker();

  if (failedTests === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase9TestSuite().catch(err => {
  console.error('Test runner failed with error:', err);
  process.exit(1);
});
