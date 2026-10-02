// Setup global localStorage mock BEFORE dynamic ES module imports
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

async function runBrowserConnectionTestSuite() {
  const { localDb } = await import('./dist/data/local/database.js');
  const { browserProfileManager } = await import('./dist/domain/services/browser/BrowserProfileManager.js');
  const { localBrowserManager } = await import('./dist/domain/services/browser/LocalBrowserManager.js');
  const { chatGPTBrowserConnector } = await import('./dist/domain/services/browser/ChatGPTBrowserConnector.js');
  const { instagramBrowserConnector } = await import('./dist/domain/services/browser/InstagramBrowserConnector.js');
  const { automationReadinessGate } = await import('./dist/domain/services/browser/AutomationReadinessGate.js');
  const { browserActionExecutor } = await import('./dist/domain/services/browser/BrowserActionExecutor.js');
  const { sessionMonitor } = await import('./dist/domain/services/browser/SessionMonitor.js');

  console.log('================================================================');
  console.log('PHASE 10 — REAL BROWSER CONNECTION & SESSION CONTROL TEST SUITE');
  console.log('================================================================\n');

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

  // 1. Persistent Browser Profile Directory Creation
  console.log('\n--- 1. Persistent Profile & Directories ---');
  const paths = browserProfileManager.ensureDirectories();
  assert(paths.profileDir.includes('.local-browser/profile'), 'Profile directory path configured correctly');
  assert(paths.downloadsDir.includes('.local-browser/downloads'), 'Downloads directory configured');
  assert(paths.screenshotsDir.includes('.local-browser/screenshots'), 'Screenshots directory configured');
  assert(paths.logsDir.includes('.local-browser/logs'), 'Logs directory configured');

  // 2. Real Local Browser Manager Launch
  console.log('\n--- 2. Real Local Browser Manager Launch ---');
  const context = await localBrowserManager.launch({ headless: true });
  const status = localBrowserManager.getStatus();
  assert(status.isProcessRunning === true && status.health === 'HEALTHY', 'Real local browser process launched persistent context');

  // 3. ChatGPT Session Connector Inspection
  console.log('\n--- 3. ChatGPT Session Connector ---');
  const cgState = await chatGPTBrowserConnector.checkSession();
  assert(cgState.status !== 'CHATGPT_OFFLINE' && !!cgState.currentUrl, `ChatGPT session connector active (${cgState.status} - ${cgState.currentUrl})`);

  // 4. Instagram Session Connector Inspection
  console.log('\n--- 4. Instagram Session Connector ---');
  const instaState = await instagramBrowserConnector.checkSession();
  assert(instaState.status !== 'INSTAGRAM_OFFLINE' && !!instaState.currentUrl, `Instagram session connector active (${instaState.status} - ${instaState.currentUrl})`);

  // 5. Session Monitor
  console.log('\n--- 5. Session Monitor ---');
  const monitorSummary = await sessionMonitor.tickMonitor();
  assert(monitorSummary.browserRunning === true, 'SessionMonitor verified browser process status');

  // 6. Automation Readiness Gate Evaluation
  console.log('\n--- 6. Automation Readiness Gate ---');
  localDb.addConcepts([{
    id: 'c_test_gate_1',
    conceptNumber: 1,
    title: 'Readiness Test Concept',
    hook: 'Hook test',
    captionPreview: 'Preview',
    fullCaption: 'Full caption text for readiness test.',
    cta: 'Visit today',
    hashtags: ['#test'],
    contentType: 'image',
    visualDirection: 'Coffee cup on table',
    platform: 'instagram',
    status: 'approved',
    visualUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    attachedMediaId: 'media_test_1',
    objective: 'Brand Awareness',
    style: 'Minimal'
  }]);

  const evalRes = await automationReadinessGate.evaluatePublishingReadiness('c_test_gate_1');
  assert(evalRes.checks.browser === true, 'Readiness gate evaluated browser process as active');
  assert(evalRes.checks.conceptApproved === true, 'Readiness gate evaluated human concept approval');
  assert(evalRes.checks.assetExists === true, 'Readiness gate evaluated media asset existence');

  // 7. Real Browser Action Executor
  console.log('\n--- 7. Real Browser Action Executor ---');
  const page = await localBrowserManager.getOrCreatePage('example.com');
  const ssPath = await browserActionExecutor.takeScreenshot(page, 'test_ss_1.png');
  assert(ssPath.includes('test_ss_1.png'), 'BrowserActionExecutor captured page screenshot');

  // 8. Zero Password Storage Audit
  console.log('\n--- 8. Zero Password Storage Audit ---');
  const allDbKeys = Object.keys(store);
  const plainPasswordCollected = allDbKeys.some(k => {
    const val = store[k] || '';
    return val.includes('"password":') || val.includes('"userPassword":') || val.includes('"plainPassword":');
  });
  assert(!plainPasswordCollected, 'Zero password credentials collected/stored across application database');

  // Clean shutdown
  console.log('\n--- 9. Browser Shutdown ---');
  await localBrowserManager.close();
  const closedStatus = localBrowserManager.getStatus();
  assert(closedStatus.isProcessRunning === false, 'Local browser process closed cleanly');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests}`);
  console.log('================================================================\n');

  if (failedTests === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runBrowserConnectionTestSuite().catch(err => {
  console.error('Browser connection test suite error:', err);
  process.exit(1);
});
