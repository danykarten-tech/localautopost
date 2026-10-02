import { 
  GenerationBatch, 
  GenerationChunk, 
  ContentRequest, 
  Concept 
} from '../models/types';
import { localDb } from '../../data/local/database';
import { MockAIProvider } from '../../providers/ai/MockAIProvider';
import { LocalSessionAIProvider } from '../../providers/ai/LocalSessionAIProvider';

const CHUNK_SIZE = 10;
export const MAX_SAFE_QUANTITY = 100;

export interface GenerationProgressPayload {
  batchId: string;
  completedQuantity: number;
  totalQuantity: number;
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  status: GenerationBatch['status'];
  statusMessage?: string;
}

export class ContentEngine {
  private activeCancelTokens: Set<string> = new Set();

  public cancelGeneration(batchId: string): void {
    this.activeCancelTokens.add(batchId);
  }

  public async startGenerationBatch(
    request: ContentRequest,
    onProgress?: (progress: GenerationProgressPayload) => void
  ): Promise<{ batch: GenerationBatch; concepts: Concept[] }> {
    if (request.quantity > MAX_SAFE_QUANTITY) {
      throw new Error(`Large generations are limited to ${MAX_SAFE_QUANTITY} concepts per request.`);
    }

    const totalQty = Math.max(1, request.quantity);
    const workspace = localDb.getWorkspace();
    const aiConfig = localDb.getAIConnection();

    // Create Parent Generation Batch
    const batchId = request.generationBatchId || `batch_${Date.now()}`;
    const batchName = `${request.topic || 'Content'} ${request.platform.toUpperCase()} Batch`;

    let batch: GenerationBatch = {
      id: batchId,
      workspaceId: workspace.id,
      name: batchName,
      platform: request.platform,
      objective: request.objective,
      topic: request.topic,
      requestedQuantity: totalQty,
      completedQuantity: 0,
      failedQuantity: 0,
      approvedQuantity: 0,
      pendingQuantity: 0,
      rejectedQuantity: 0,
      status: 'generating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localDb.saveGenerationBatch(batch);
    localDb.logActivity('concept_generated', 'Batch Generation Started', `Started generating ${totalQty} concepts for "${request.topic}".`);

    const totalChunks = Math.ceil(totalQty / CHUNK_SIZE);
    const allGeneratedConcepts: Concept[] = [];
    const aiProvider = aiConfig.providerType === 'local_session' 
      ? new LocalSessionAIProvider() 
      : new MockAIProvider();

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      if (this.activeCancelTokens.has(batchId)) {
        this.activeCancelTokens.delete(batchId);
        batch.status = 'cancelled';
        batch.updatedAt = new Date().toISOString();
        localDb.saveGenerationBatch(batch);
        localDb.logActivity('concept_generated', 'Batch Generation Cancelled', `Generation cancelled at ${batch.completedQuantity}/${totalQty} concepts.`);
        break;
      }

      const currentChunkQty = Math.min(CHUNK_SIZE, totalQty - (chunkIdx * CHUNK_SIZE));
      const brand = localDb.getBrand();
      const toneVal = request.tone || brand.toneOfVoice || brand.brandTone || 'Artisanal & Intelligent';
      
      // Generate chunk
      const chunkConcepts = await aiProvider.generateConcepts({
        objective: request.objective,
        quantity: currentChunkQty,
        platform: request.platform,
        style: request.style,
        topic: request.topic,
        tone: toneVal,
        instructions: request.additionalInstructions,
        brandVoice: toneVal,
        targetAudience: brand.targetAudience,
        industry: workspace.industry
      });

      // Tag concepts with generationBatchId
      const taggedConcepts = chunkConcepts.map((c, i) => ({
        ...c,
        generationBatchId: batchId,
        conceptNumber: batch.completedQuantity + i + 1
      }));

      // Add to local database
      localDb.addConcepts(taggedConcepts);
      allGeneratedConcepts.push(...taggedConcepts);

      batch.completedQuantity += taggedConcepts.length;
      batch.pendingQuantity += taggedConcepts.length;
      batch.updatedAt = new Date().toISOString();

      if (batch.completedQuantity >= totalQty) {
        batch.status = 'completed';
      } else {
        batch.status = 'generating';
      }

      localDb.saveGenerationBatch(batch);

      if (onProgress) {
        onProgress({
          batchId,
          completedQuantity: batch.completedQuantity,
          totalQuantity: totalQty,
          currentChunk: chunkIdx + 1,
          totalChunks,
          percentage: Math.round((batch.completedQuantity / totalQty) * 100),
          status: batch.status
        });
      }

      // Small tick delay to keep UI smooth and unblocked
      await new Promise(r => setTimeout(r, 250));
    }

    if (batch.status === 'completed') {
      localDb.logActivity('concept_generated', 'Batch Completed', `Successfully created ${batch.completedQuantity} concepts for campaign.`);
    }

    return { batch, concepts: allGeneratedConcepts };
  }

  public async generateMoreConcepts(
    batchId: string,
    additionalQuantity: number,
    onProgress?: (progress: GenerationProgressPayload) => void
  ): Promise<Concept[]> {
    const batch = localDb.getGenerationBatch(batchId);
    if (!batch) throw new Error('Batch not found');

    const newRequestQty = batch.requestedQuantity + additionalQuantity;
    batch.requestedQuantity = newRequestQty;
    batch.status = 'generating';
    localDb.saveGenerationBatch(batch);

    const existingConcepts = localDb.getConcepts().filter(c => c.generationBatchId === batchId);

    const request: ContentRequest = {
      id: `req_${Date.now()}`,
      workspaceId: batch.workspaceId,
      platform: batch.platform,
      objective: batch.objective,
      topic: batch.topic,
      quantity: additionalQuantity,
      tone: 'Professional',
      style: 'Minimal',
      generationBatchId: batchId,
      createdAt: new Date().toISOString()
    };

    const { concepts } = await this.startGenerationBatch(request, onProgress);
    return concepts;
  }
}

export const contentEngine = new ContentEngine();
