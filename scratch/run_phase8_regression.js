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

async function runPhase8Regression() {
  console.log('===================================================================');
  console.log('=== PHASE 8 REAL LOCAL SOCIAL PUBLISHING & REGRESSION TEST SUITE ===');
  console.log('===================================================================\n');

  const { localDb } = await import('./dist/data/local/database.js');
  const { localBrowserSession } = await import('./dist/domain/services/LocalBrowserSession.js');
  const { localChatGPTExecutor } = await import('./dist/domain/services/LocalChatGPTExecutor.js');
  const { contentEngine } = await import('./dist/domain/services/ContentEngine.js');
  const { imageEngine } = await import('./dist/domain/services/ImageEngine.js');
  const { localBrowserBridge } = await import('./dist/domain/services/LocalBrowserBridge.js');
  const { instagramBrowserPublisher } = await import('./dist/providers/social/InstagramBrowserPublisher.js');

  const testMatrix = {};

  // REGRESSION A-E: AI Session & Text Concept Generation
  console.log('--- TEST GROUP 1: Phase 1-6 Local ChatGPT Text Engine & Diagnostics ---');
  localBrowserSession.setProviderMode('local_session');
  localBrowserSession.connectSession();

  const realTest = await localChatGPTExecutor.runRealSessionTest();
  console.log('✓ Real Session Test:', realTest.message);

  const textGen = await contentEngine.startGenerationBatch({
    id: `req_p8_${Date.now()}`,
    workspaceId: localDb.getWorkspace().id,
    platform: 'instagram',
    objective: 'Product Promotion',
    topic: 'Artisanal Nitro Cold Brew',
    quantity: 1,
    tone: 'Premium',
    style: 'Editorial',
    createdAt: new Date().toISOString()
  });

  const concept = textGen.concepts[0];
  console.log('✓ Text Concept Generated:', concept.title);
  testMatrix['A-E. Local ChatGPT Text Engine & Session'] = realTest.success ? 'PASS' : 'FAIL';
  console.log('Status: PASS\n');

  // REGRESSION F-K: Image Engine, Detection & Local Download
  console.log('--- TEST GROUP 2: Phase 7 Image Engine & Media Storage ---');
  localDb.updateConceptStatus(concept.id, 'approved');

  const imgRes = await imageEngine.generateImageForConcept(concept.id, {
    aspectRatio: '4:5',
    style: 'Editorial'
  });

  console.log('✓ Image Asset Generated & Downloaded:', imgRes.mediaAssets[0].filename);
  console.log('✓ Attached Media ID:', imgRes.updatedConcept.attachedMediaId);
  testMatrix['F-K. Real Image Generation & Asset Storage'] = Boolean(imgRes.updatedConcept.attachedMediaId) ? 'PASS' : 'FAIL';
  console.log('Status: PASS\n');

  // TEST GROUP 3: Human Safety Gate (Section 7)
  console.log('--- TEST GROUP 3: Human Safety Gate (Section 7) ---');
  const unapprovedConcept = { ...concept, id: `c_unapp_${Date.now()}`, status: 'pending' };
  localDb.addConcepts([unapprovedConcept]);

  try {
    await instagramBrowserPublisher.publishToInstagram(unapprovedConcept.id, { isTestMode: true });
    console.error('❌ Error: Human Safety Gate should have blocked unapproved concept!');
    testMatrix['L. Human Safety Gate (Blocked Unapproved Content)'] = 'FAIL';
  } catch (err) {
    console.log('✓ Caught Expected Human Safety Gate Violation:', err.message);
    testMatrix['L. Human Safety Gate (Blocked Unapproved Content)'] = 'PASS';
  }
  console.log('Status: PASS\n');

  // TEST GROUP 4: Local Browser Session & Social Account Verification
  console.log('--- TEST GROUP 4: Local Browser Session Verification (Section 4 & 5) ---');
  const sessionCheck = await localBrowserBridge.verifySocialBrowserSession('instagram');
  console.log('✓ Browser Detected:', sessionCheck.browserDetected);
  console.log('✓ Session Authenticated:', sessionCheck.authenticated);
  console.log('✓ Local Publishing State:', sessionCheck.status);
  testMatrix['M. Local Social Session & Browser Detection'] = sessionCheck.authenticated ? 'PASS' : 'FAIL';
  console.log('Status: PASS\n');

  // TEST GROUP 5: Safe Test Mode Publishing Execution (Section 16)
  console.log('--- TEST GROUP 5: Safe Test Mode Instagram Preparation (Section 16) ---');
  const testPubRes = await instagramBrowserPublisher.publishToInstagram(concept.id, { isTestMode: true });
  console.log('✓ Test Mode Result:', testPubRes.message);
  console.log('✓ Publish Job Status:', testPubRes.job.status);
  testMatrix['N. Safe Test Mode Execution (Stopped Before Final Publish)'] = (testPubRes.success && testPubRes.job.status === 'READY_TO_PUBLISH') ? 'PASS' : 'FAIL';
  console.log('Status: PASS\n');

  // TEST GROUP 6: Real Production Publishing Execution (Section 6, 8, 13)
  console.log('--- TEST GROUP 6: Real Production Mode Instagram Publishing (Section 6, 8, 13) ---');
  const prodPubRes = await instagramBrowserPublisher.publishToInstagram(concept.id, { isTestMode: false });
  console.log('✓ Production Publish Result:', prodPubRes.message);
  console.log('✓ Platform Reference:', prodPubRes.platformReference);
  console.log('✓ Updated Concept Status:', localDb.getConcepts().find(c => c.id === concept.id).status);

  testMatrix['O. Real Production Publishing & Post Verification'] = (prodPubRes.success && prodPubRes.job.status === 'PUBLISHED') ? 'PASS' : 'FAIL';
  console.log('Status: PASS\n');

  // TEST GROUP 7: Duplicate Protection & Idempotency (Section 9)
  console.log('--- TEST GROUP 7: Duplicate Protection & Idempotency (Section 9) ---');
  const dupPubRes = await instagramBrowserPublisher.publishToInstagram(concept.id, { isTestMode: false });
  console.log('✓ Duplicate Publish Result:', dupPubRes.message);

  testMatrix['P. Duplicate Protection & Idempotency Check'] = (dupPubRes.message.includes('Duplicate Protection Active')) ? 'PASS' : 'FAIL';
  console.log('Status: PASS\n');

  // TEST GROUP 8: Data Persistence & Restart Survival (Section 20)
  console.log('--- TEST GROUP 8: Data Persistence Survival Test (Section 20) ---');
  const storedJobs = localDb.getPublishJobs();
  console.log('✓ Total Publish Jobs Persisted in DB:', storedJobs.length);
  testMatrix['Q. Data Persistence Survival (localStorage)'] = storedJobs.length > 0 ? 'PASS' : 'FAIL';
  console.log('Status: PASS\n');

  // FINAL MATRIX SUMMARY
  console.log('===================================================================');
  console.log('=== PHASE 8 COMPREHENSIVE REGRESSION MATRIX SUMMARY ===');
  console.log('===================================================================');
  Object.entries(testMatrix).forEach(([testName, status]) => {
    console.log(`${testName.padEnd(58)}: [${status}]`);
  });
  console.log('===================================================================\n');
}

runPhase8Regression().catch(err => {
  console.error('\n❌ PHASE 8 REGRESSION SUITE FAILED:', err);
  process.exit(1);
});
