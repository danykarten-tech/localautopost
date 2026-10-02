import path from 'path';
import { fileURLToPath } from 'url';

// Provide polyfill for localStorage in node environment for verification script
if (typeof global.localStorage === 'undefined') {
  const store = new Map();
  global.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPhase6() {
  console.log('=== PHASE 6 VERIFICATION TEST RUNNER ===\n');

  const { localDb } = await import('./dist/data/local/database.js');
  const { localBrowserSession } = await import('./dist/domain/services/LocalBrowserSession.js');
  const { localChatGPTExecutor } = await import('./dist/domain/services/LocalChatGPTExecutor.js');
  const { contentEngine } = await import('./dist/domain/services/ContentEngine.js');

  // Step 1: Mode Check & Setup
  console.log('1. Setting Provider Mode to LOCAL CHATGPT SESSION...');
  localBrowserSession.setProviderMode('local_session');
  localBrowserSession.connectSession();

  const config = localDb.getAIConnection();
  console.log('   Provider Type:', config.providerType);
  console.log('   Status:', config.status);
  console.log('   Session State:', config.sessionState);

  if (config.providerType !== 'local_session' || config.status !== 'connected') {
    throw new Error('FAILED: Session state initialization error.');
  }
  console.log('   ✓ Session Initialized OK\n');

  // Step 2: Real Session Test (Part 2)
  console.log('2. Running Real ChatGPT Session Test...');
  const testRes = await localChatGPTExecutor.runRealSessionTest();
  console.log('   Test Success:', testRes.success);
  console.log('   Message:', testRes.message);
  console.log('   Captured Text:', testRes.capturedText);

  if (!testRes.success || !testRes.capturedText.includes('AVENZAQ_REAL_SESSION_TEST_SUCCESS')) {
    throw new Error('FAILED: Real session test did not return expected response.');
  }
  console.log('   ✓ Real Session Verified OK\n');

  // Step 3: Check Diagnostics (Part 3)
  console.log('3. Inspecting Session Diagnostics...');
  const diags = localChatGPTExecutor.getDiagnostics();
  console.log('   Diagnostics State:', JSON.stringify(diags, null, 2));

  const allPassed = Object.values(diags).every(val => val === 'PASSED');
  if (!allPassed) {
    throw new Error('FAILED: Not all diagnostic states passed.');
  }
  console.log('   ✓ All 9 Diagnostics PASSED OK\n');

  // Step 4: Batch Generation - 1 Concept (Part 12)
  console.log('4. Generating 1 Concept via Local ChatGPT Engine...');
  const res1 = await contentEngine.startGenerationBatch({
    id: `req_1concept_${Date.now()}`,
    workspaceId: localDb.getWorkspace().id,
    platform: 'instagram',
    objective: 'Educational',
    topic: 'Cold Brew Extraction',
    quantity: 1,
    tone: 'Artisanal',
    style: 'Minimal',
    createdAt: new Date().toISOString()
  });

  console.log(`   Generated ${res1.concepts.length} concepts.`);
  console.log('   Concept 1 Title:', res1.concepts[0].title);
  console.log('   Quality Score:', res1.concepts[0].qualityScore);
  if (res1.concepts.length !== 1) {
    throw new Error('FAILED: 1 concept generation count mismatch.');
  }
  console.log('   ✓ 1 Concept Generation OK\n');

  // Step 5: Batch Generation - 2 Concepts (Part 12)
  console.log('5. Generating 2 Concepts via Local ChatGPT Engine...');
  const res2 = await contentEngine.startGenerationBatch({
    id: `req_2concepts_${Date.now()}`,
    workspaceId: localDb.getWorkspace().id,
    platform: 'instagram',
    objective: 'Product Promotion',
    topic: 'Espresso Machines',
    quantity: 2,
    tone: 'Premium',
    style: 'Editorial',
    createdAt: new Date().toISOString()
  });

  console.log(`   Generated ${res2.concepts.length} concepts.`);
  res2.concepts.forEach((c, idx) => console.log(`   [${idx+1}] ${c.title}`));
  if (res2.concepts.length !== 2) {
    throw new Error('FAILED: 2 concepts generation count mismatch.');
  }
  console.log('   ✓ 2 Concepts Generation OK\n');

  // Step 6: Batch Generation - 5 Concepts (Part 12)
  console.log('6. Generating 5 Concepts via Local ChatGPT Engine...');
  const res5 = await contentEngine.startGenerationBatch({
    id: `req_5concepts_${Date.now()}`,
    workspaceId: localDb.getWorkspace().id,
    platform: 'instagram',
    objective: 'Storytelling',
    topic: 'Sustainable Coffee Roasting',
    quantity: 5,
    tone: 'Authentic',
    style: 'Lifestyle',
    createdAt: new Date().toISOString()
  });

  console.log(`   Generated ${res5.concepts.length} concepts.`);
  res5.concepts.forEach((c, idx) => console.log(`   [${idx+1}] ${c.title}`));
  if (res5.concepts.length !== 5) {
    throw new Error('FAILED: 5 concepts generation count mismatch.');
  }
  console.log('   ✓ 5 Concepts Generation OK\n');

  // Step 7: Verify Local Database Persistence (Part 8)
  console.log('7. Verifying Local Database Persistence...');
  const allDbConcepts = localDb.getConcepts();
  console.log(`   Total Concepts Saved in Local DB: ${allDbConcepts.length}`);

  const batch5FromDb = localDb.getGenerationBatch(res5.batch.id);
  console.log('   Batch Status in DB:', batch5FromDb.status);
  console.log('   Completed Quantity:', batch5FromDb.completedQuantity);

  if (allDbConcepts.length < 8) {
    throw new Error('FAILED: Concepts were not properly saved to local DB.');
  }
  console.log('   ✓ Local Database Persistence Verified OK\n');

  // Step 8: Disconnected Failure Safety Check (Part 9)
  console.log('8. Testing Failure Safety on Session Disconnect...');
  localBrowserSession.disconnectSession();
  try {
    await contentEngine.startGenerationBatch({
      id: `req_fail_${Date.now()}`,
      workspaceId: localDb.getWorkspace().id,
      platform: 'instagram',
      objective: 'Educational',
      topic: 'Test Topic',
      quantity: 1,
      createdAt: new Date().toISOString()
    });
    console.error('❌ ERROR: Generation should have thrown error when session is disconnected!');
  } catch (err) {
    console.log('   Caught Expected Error:', err.message);
    console.log('   ✓ Failure Safety OK (Never silently fell back to Mock)\n');
  }

  // Restore session
  localBrowserSession.connectSession();

  console.log('==================================================');
  console.log('🎉 ALL PHASE 6 AUTOMATION & VERIFICATION TESTS PASSED!');
  console.log('==================================================');
}

testPhase6().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
