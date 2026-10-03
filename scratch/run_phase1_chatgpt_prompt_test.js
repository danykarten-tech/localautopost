// Setup mock localStorage for Node environment
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

import { localDb } from '../src/data/local/database';
import { browserProfileManager } from '../src/domain/services/browser/BrowserProfileManager';
import { localBrowserManager } from '../src/domain/services/browser/LocalBrowserManager';
import { chatGPTBrowserConnector } from '../src/domain/services/browser/ChatGPTBrowserConnector';
import { localChatGPTExecutor } from '../src/domain/services/LocalChatGPTExecutor';

async function runPhase1RealChatGPTTest() {
  console.log('================================================================');
  console.log('PHASE 1 — REAL CHATGPT DOM PROMPT INJECTION TEST SUITE');
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

  try {
    // 1. Verify Persistent Profile Architecture
    console.log('--- 1. Browser Profile & Environment Check ---');
    const profilePath = browserProfileManager.getProfilePath();
    assert(profilePath.includes('.local-browser/profile'), `Persistent profile path verified: "${profilePath}"`);

    // 2. Launch Real Persistent Browser Context
    console.log('\n--- 2. Real Local Persistent Browser Launch ---');
    const context = await localBrowserManager.launch({ headless: false });
    assert(context !== null, 'Real Playwright Chromium persistent context launched');

    // 3. Inspect Real ChatGPT Session State
    console.log('\n--- 3. Real ChatGPT DOM Session Inspection ---');
    const connState = await chatGPTBrowserConnector.checkSession();
    assert(connState.status !== undefined, `ChatGPT session connector active (Status: ${connState.status}, URL: ${connState.currentUrl})`);

    // 4. Test Prompt Execution Path
    console.log('\n--- 4. Real ChatGPT DOM Prompt Injection & Response Capture ---');
    if (connState.isReady) {
      console.log('[INFO] Authenticated ChatGPT session detected! Executing real DOM prompt injection...');
      const testPrompt = 'Reply with exactly: CHATGPT_REAL_CONNECTION_TEST_OK';
      const execResult = await localChatGPTExecutor.executeChatGPTPrompt(testPrompt, (step) => {
        console.log(`  ➜ Step: ${step}`);
      });

      assert(execResult.success === true, `Prompt execution succeeded (Mode: ${execResult.executionMode})`);
      assert(execResult.executionMode === 'REAL', 'Execution mode confirmed REAL browser DOM interaction');
      assert(execResult.response.includes('CHATGPT_REAL_CONNECTION_TEST_OK'), `Captured response verified expected text ("${execResult.response.slice(0, 50)}...")`);
    } else {
      console.log(`[INFO] ChatGPT session state is "${connState.status}". User manual authentication required.`);
      assert(connState.status === 'CHATGPT_LOGIN_REQUIRED' || connState.status === 'CHATGPT_ACTION_REQUIRED' || connState.status === 'CHATGPT_BROWSER_OPEN', `Login/Action Required state correctly identified (${connState.status})`);
      
      const testPrompt = 'Reply with exactly: CHATGPT_REAL_CONNECTION_TEST_OK';
      const execResult = await localChatGPTExecutor.executeChatGPTPrompt(testPrompt);
      assert(execResult.success === false && execResult.errorCode === 'ACTION_REQUIRED', 'Unauthenticated prompt attempt gracefully caught & returned ACTION_REQUIRED');
    }

    // 5. Zero Password Storage Audit
    console.log('\n--- 5. Security & Zero Password Storage Audit ---');
    const aiConn = localDb.getAIConnection();
    assert(aiConn['password'] === undefined, 'Zero passwords stored in AI connection config');

    // 6. Clean Browser Shutdown
    console.log('\n--- 6. Browser Shutdown ---');
    await localBrowserManager.close();
    assert(localBrowserManager.getStatus().isProcessRunning === false, 'Local browser context closed cleanly');

  } catch (err) {
    console.error('[FATAL ERROR IN TEST SUITE]:', err);
    failedTests++;
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests}`);
  console.log('================================================================\n');
}

runPhase1RealChatGPTTest();
