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

async function runRealUserVerificationSuite() {
  console.log('================================================================');
  console.log('REAL USER VERIFICATION PHASE — CHATGPT END-TO-END DOM AUDIT');
  console.log('================================================================\n');

  let lastLoggedUrl = '';
  let currentState = 'LAUNCH_BROWSER';

  function logState(stateName, msg) {
    currentState = stateName;
    console.log(`[${stateName}] ${msg}`);
  }

  let test1Success = false;
  let test2Success = false;
  let persistenceSuccess = false;
  let test1ResponseText = '';
  let test2ResponseText = '';
  let rootCauseReport = '';

  try {
    // 1. LAUNCH_BROWSER
    logState('BROWSER', 'Browser launched using persistent profile directory (".local-browser/profile/")');
    const profilePath = browserProfileManager.getProfilePath();
    const context = await localBrowserManager.launch({ headless: false });

    // 2. OPEN_CHATGPT
    logState('CHATGPT', 'Page opened (https://chatgpt.com)');
    let connState = await chatGPTBrowserConnector.checkSession();
    lastLoggedUrl = connState.currentUrl || 'https://chatgpt.com';
    console.log(`[CHATGPT] Initial page URL: ${lastLoggedUrl} (Status: ${connState.status})`);

    // Attach navigation observer to print live URL changes without interfering
    const page = await localBrowserManager.getOrCreatePage('chatgpt.com');
    if (page && typeof page.on === 'function') {
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          const newUrl = frame.url();
          if (newUrl !== lastLoggedUrl) {
            console.log(`[LOGIN] Navigation detected: ${newUrl}`);
            lastLoggedUrl = newUrl;
          }
        }
      });
    }

    // 3. WAIT_FOR_MANUAL_LOGIN (Silent Observer Mode)
    if (!connState.isReady) {
      logState('LOGIN', 'Waiting for manual login...');
      console.log('[LOGIN] Please complete your login or authentication in the Chrome window.');
      console.log('[LOGIN] Silent Observer Mode Active — System will NOT refresh, reload, or navigate away.');

      // Monitor page silently without invoking page.goto()
      let waitMinutes = 0;
      const maxWaitMinutes = 10; // Wait up to 10 minutes for user to manually log in
      
      while (waitMinutes < maxWaitMinutes * 12) {
        await new Promise(r => setTimeout(r, 5000));
        connState = await chatGPTBrowserConnector.checkSession();

        if (connState.status === 'CHATGPT_ACTION_REQUIRED') {
          logState('LOGIN', 'Security Challenge / CAPTCHA detected. Please complete human verification in browser.');
        }

        if (connState.isReady) {
          logState('LOGIN', 'Waiting for stable authenticated state...');
          await new Promise(r => setTimeout(r, 2000));
          logState('LOGIN', 'ChatGPT authenticated');
          logState('CHATGPT', 'CHATGPT_READY');
          break;
        }
        waitMinutes++;
      }
    } else {
      logState('LOGIN', 'ChatGPT authenticated');
      logState('CHATGPT', 'CHATGPT_READY');
    }

    // 4. RUN_LIVE_TEST (If authenticated)
    if (connState.isReady) {
      logState('RUN_LIVE_TEST', 'Executing Test 1: Test Prompt "Reply with exactly: POSTPILOT_CHATGPT_LIVE_TEST_OK"...');
      const test1Prompt = 'Reply with exactly: POSTPILOT_CHATGPT_LIVE_TEST_OK';
      
      const test1Result = await localChatGPTExecutor.executeChatGPTPrompt(test1Prompt, (step) => {
        console.log(`[RUN_LIVE_TEST]   ➜ ${step}`);
      });

      console.log(`[RUN_LIVE_TEST] Test 1 Result: Success = ${test1Result.success}, Mode = ${test1Result.executionMode || 'REAL'}`);
      if (test1Result.response) {
        console.log(`[RUN_LIVE_TEST] Extracted Response Text: "${test1Result.response.slice(0, 120)}"`);
      }

      if (test1Result.success && test1Result.response.includes('POSTPILOT_CHATGPT_LIVE_TEST_OK')) {
        test1Success = true;
        test1ResponseText = test1Result.response;
        console.log('[PASS] Test 1 response contains expected exact string "POSTPILOT_CHATGPT_LIVE_TEST_OK".');
      } else {
        console.error(`[FAIL] Test 1 failed: ${test1Result.errorMessage || 'Text mismatch'}`);
      }

      // Test 2: Dynamic Content Generation Prompt
      logState('RUN_LIVE_TEST', 'Executing Test 2: Content Generation Prompt "Create a 1-sentence social media hook about morning coffee productivity."...');
      const test2Prompt = 'Create a 1-sentence social media hook about morning coffee productivity.';
      
      const test2Result = await localChatGPTExecutor.executeChatGPTPrompt(test2Prompt, (step) => {
        console.log(`[RUN_LIVE_TEST]   ➜ ${step}`);
      });

      console.log(`[RUN_LIVE_TEST] Test 2 Result: Success = ${test2Result.success}, Mode = ${test2Result.executionMode || 'REAL'}`);
      if (test2Result.response) {
        console.log(`[RUN_LIVE_TEST] Extracted Real ChatGPT Response: "${test2Result.response}"`);
      }

      if (test2Result.success && test2Result.response.length > 10) {
        test2Success = true;
        test2ResponseText = test2Result.response;
        console.log(`[PASS] Test 2 dynamic generation successful (${test2Result.response.length} chars extracted).`);
      } else {
        console.error(`[FAIL] Test 2 failed: ${test2Result.errorMessage || 'Empty response'}`);
      }

      // Test 3: Session Persistence Across Restart
      logState('RESTART_CHECK', 'Closing browser context to test profile persistence across restart...');
      await localBrowserManager.close();
      
      logState('RESTART_CHECK', 'Re-launching Playwright persistent Chromium context from disk profile...');
      await localBrowserManager.launch({ headless: false });
      
      const recheckState = await chatGPTBrowserConnector.checkSession();
      console.log(`[RESTART_CHECK] Post-Restart Session Status: ${recheckState.status}`);

      if (recheckState.isReady) {
        persistenceSuccess = true;
        console.log('[PASS] Session persisted cleanly across browser restart without requiring credentials.');
      } else {
        console.error(`[FAIL] Session lost after restart (Status: ${recheckState.status}).`);
      }
    } else {
      console.log('\n[INFO] Manual login not completed within wait period. Script stopped cleanly at WAIT_FOR_MANUAL_LOGIN.');
    }

    await localBrowserManager.close();

  } catch (err) {
    console.error('[FATAL ERROR]:', err);
  }

  console.log('\n================================================================');
  console.log(`STATUS SUMMARY: Test 1 Success = ${test1Success}, Test 2 Success = ${test2Success}, Persistence = ${persistenceSuccess}`);
  console.log('================================================================\n');

  return {
    test1Success,
    test2Success,
    persistenceSuccess,
    test1ResponseText,
    test2ResponseText
  };
}

runRealUserVerificationSuite();
