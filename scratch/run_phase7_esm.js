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

async function testPhase7() {
  console.log('==================================================');
  console.log('=== PHASE 7 END-TO-END VERIFICATION TEST RUNNER ===');
  console.log('==================================================\n');

  const { localDb } = await import('./dist/data/local/database.js');
  const { localBrowserSession } = await import('./dist/domain/services/LocalBrowserSession.js');
  const { localChatGPTExecutor } = await import('./dist/domain/services/LocalChatGPTExecutor.js');
  const { contentEngine } = await import('./dist/domain/services/ContentEngine.js');
  const { imageEngine } = await import('./dist/domain/services/ImageEngine.js');
  const { ImagePromptBuilder } = await import('./dist/domain/services/ImagePromptBuilder.js');
  const { chatGPTImageDetector } = await import('./dist/domain/services/ChatGPTImageDetector.js');

  // Step 1: Session Connection & Mode Verification
  console.log('1. Initializing Local ChatGPT Session Mode...');
  localBrowserSession.setProviderMode('local_session');
  localBrowserSession.connectSession();

  const conn = localDb.getAIConnection();
  console.log('   Provider Mode:', conn.providerType);
  console.log('   Connection Status:', conn.status);
  console.log('   Session State:', conn.sessionState);

  if (conn.providerType !== 'local_session' || conn.status !== 'connected') {
    throw new Error('FAILED: Session state initialization error.');
  }
  console.log('   ✓ Local ChatGPT Session Connected OK\n');

  // Step 2: Image Prompt Builder Test (Part 4 & 5)
  console.log('2. Testing Deterministic Image Prompt Builder across Aspect Ratios...');
  const prompt45 = ImagePromptBuilder.buildStructuredChatGPTImagePrompt({
    title: 'Artisanal Cold Brew Hero',
    hook: 'Smooth 24-Hour Extraction',
    objective: 'Product Promotion',
    style: 'Minimal',
    aspectRatio: '4:5',
    platform: 'instagram'
  });
  console.log('   Generated 4:5 Prompt:\n' + prompt45);

  if (!prompt45.includes('4:5') || !prompt45.includes('Artisanal Cold Brew Hero')) {
    throw new Error('FAILED: ImagePromptBuilder did not include aspect ratio or title.');
  }
  console.log('   ✓ Image Prompt Builder Verified OK\n');

  // Step 3: Text Concept Generation (Phase 6 Continuity Test)
  console.log('3. Generating Approved Concept via Content Engine (Phase 6 Continuity)...');
  const textRes = await contentEngine.startGenerationBatch({
    id: `req_p7_${Date.now()}`,
    workspaceId: localDb.getWorkspace().id,
    platform: 'instagram',
    objective: 'Product Promotion',
    topic: 'Single-Origin Espresso Shot',
    quantity: 1,
    tone: 'Premium',
    style: 'Editorial',
    createdAt: new Date().toISOString()
  });

  const concept = textRes.concepts[0];
  console.log('   Generated Concept ID:', concept.id);
  console.log('   Concept Title:', concept.title);

  // Approve concept to prepare for image generation
  localDb.updateConceptStatus(concept.id, 'approved');
  console.log('   Concept Status Updated: approved\n');

  // Step 4: Real Image Generation Automation Pipeline (Part 1, 6, 8, 9, 10, 11, 12)
  console.log('4. Executing Real Local ChatGPT Image Generation Pipeline...');
  const statesTracked = [];
  const imageRes = await localChatGPTExecutor.generateImageWithChatGPT(
    {
      id: `img_job_${Date.now()}`,
      contentId: concept.id,
      prompt: concept.visualDirection || concept.title,
      style: 'Editorial',
      aspectRatio: '4:5',
      quantity: 1,
      createdAt: new Date().toISOString()
    },
    (st) => {
      statesTracked.push(st);
      console.log(`   [State Transition] -> ${st}`);
    }
  );

  console.log('   Image Generation Success:', imageRes.success);
  console.log('   Duration:', imageRes.durationMs, 'ms');
  console.log('   Media Assets Returned:', imageRes.mediaAssets.length);

  if (!imageRes.success || imageRes.mediaAssets.length === 0) {
    throw new Error(`FAILED: Image generation failed. Reason: ${imageRes.errorMessage}`);
  }

  const asset = imageRes.mediaAssets[0];
  console.log('   Downloaded Asset ID:', asset.id);
  console.log('   Filename:', asset.filename);
  console.log('   Local Path:', asset.localPath);
  console.log('   Mime Type:', asset.mimeType);
  console.log('   Dimensions:', `${asset.width}x${asset.height}`);
  console.log('   ✓ Real Image Generated & Downloaded OK\n');

  // Step 5: Verify Media Library Storage & Concept Link (Part 11, 12, 22)
  console.log('5. Verifying Media Library & Concept Relationship...');
  const storedAssets = localDb.getMediaAssets();
  const matchedAsset = storedAssets.find(a => a.id === asset.id);
  if (!matchedAsset) {
    throw new Error('FAILED: Media asset not found in localDb.getMediaAssets().');
  }
  console.log('   Asset Saved in Local DB:', matchedAsset.filename);

  const updatedConcept = localDb.getConcepts().find(c => c.id === concept.id);
  console.log('   Concept Attached Media ID:', updatedConcept.attachedMediaId);
  console.log('   Concept Visual URL:', updatedConcept.visualUrl);

  if (updatedConcept.attachedMediaId !== asset.id || !updatedConcept.visualUrl) {
    throw new Error('FAILED: Concept was not linked to generated image asset.');
  }
  console.log('   ✓ Concept ↔ Media Asset Link Verified OK\n');

  // Step 6: Test Second Concept & Image Engine Integration (Part 12, 29)
  console.log('6. Generating Image for Second Concept via ImageEngine...');
  const textRes2 = await contentEngine.startGenerationBatch({
    id: `req_p7_2_${Date.now()}`,
    workspaceId: localDb.getWorkspace().id,
    platform: 'instagram',
    objective: 'Educational',
    topic: 'Pour Over Chemistry',
    quantity: 1,
    tone: 'Scientific',
    style: 'Minimal',
    createdAt: new Date().toISOString()
  });

  const concept2 = textRes2.concepts[0];
  localDb.updateConceptStatus(concept2.id, 'approved');

  const engineRes = await imageEngine.generateImageForConcept(concept2.id, {
    aspectRatio: '1:1',
    style: 'Minimal'
  });

  console.log('   Concept 2 Title:', engineRes.updatedConcept.title);
  console.log('   Generated Image URL:', engineRes.updatedConcept.visualUrl);
  if (!engineRes.updatedConcept.attachedMediaId) {
    throw new Error('FAILED: ImageEngine did not attach media ID to concept 2.');
  }
  console.log('   ✓ Second Concept Image Generation OK\n');

  // Step 7: Bulk Queue Image Generation Test (Part 15)
  console.log('7. Testing Sequential Bulk Image Queue Generation...');
  const textResBulk = await contentEngine.startGenerationBatch({
    id: `req_bulk_${Date.now()}`,
    workspaceId: localDb.getWorkspace().id,
    platform: 'instagram',
    objective: 'Storytelling',
    topic: 'Roastery Operations',
    quantity: 2,
    createdAt: new Date().toISOString()
  });

  const bulkConceptIds = textResBulk.concepts.map(c => c.id);
  bulkConceptIds.forEach(id => localDb.updateConceptStatus(id, 'approved'));

  const bulkRes = await imageEngine.bulkGenerateImages(bulkConceptIds, (comp, total, fail) => {
    console.log(`   [Queue Progress] ${comp}/${total} completed (failed: ${fail})`);
  });

  console.log('   Bulk Queue Completed:', bulkRes.completedCount);
  console.log('   Bulk Queue Failed:', bulkRes.failedIds.length);
  if (bulkRes.completedCount !== 2) {
    throw new Error('FAILED: Bulk queue image generation count mismatch.');
  }
  console.log('   ✓ Bulk Image Queue System OK\n');

  // Step 8: Disconnected Session Failure Safety Test (Part 13, 24)
  console.log('8. Testing Disconnected Session Failure Safety...');
  localBrowserSession.disconnectSession();

  try {
    await imageEngine.generateImageForConcept(concept.id);
    console.error('❌ ERROR: Image generation should have failed when session is disconnected!');
  } catch (err) {
    console.log('   Caught Expected Disconnect Error:', err.message);
    if (!err.message.includes('ChatGPT browser session required') && !err.message.includes('disconnected')) {
      throw new Error(`FAILED: Unexpected disconnect error message: ${err.message}`);
    }
    console.log('   ✓ Failure Safety OK (Zero silent mock fallback)\n');
  }

  // Restore session
  localBrowserSession.connectSession();

  console.log('==================================================');
  console.log('🎉 ALL PHASE 7 REAL IMAGE AUTOMATION TESTS PASSED!');
  console.log('==================================================');
}

testPhase7().catch(err => {
  console.error('\n❌ PHASE 7 VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
