import { 
  ImageGenerationRequest, 
  MediaAsset, 
  ImageJob, 
  Concept, 
  ImageEngineSettings,
  ImageStyle,
  AspectRatioType
} from '../models/types';
import { localDb } from '../../data/local/database';
import { MockImageProvider } from '../../providers/image/MockImageProvider';
import { ImageValidator } from './ImageValidator';

const SETTINGS_KEY = 'avenzaq_image_engine_settings';

export class ImageEngine {
  private activeCancelTokens: Set<string> = new Set();

  public getSettings(): ImageEngineSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const defaultSettings: ImageEngineSettings = {
        provider: 'mock',
        defaultStyle: 'Minimal',
        defaultAspectRatio: '4:5',
        defaultQuantity: 1,
        autoGenerateAfterApproval: false,
        maxConcurrentJobs: 3
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(raw);
  }

  public updateSettings(settings: Partial<ImageEngineSettings>): ImageEngineSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  public cancelImageGeneration(batchOrJobId: string): void {
    this.activeCancelTokens.add(batchOrJobId);
  }

  public async generateImageForConcept(
    conceptId: string,
    options?: {
      style?: ImageStyle | string;
      aspectRatio?: AspectRatioType | string;
      quantity?: number;
      promptText?: string;
      additionalInstructions?: string;
    }
  ): Promise<{ mediaAssets: MediaAsset[]; updatedConcept: Concept }> {
    const concepts = localDb.getConcepts();
    const concept = concepts.find(c => c.id === conceptId);
    if (!concept) throw new Error('Concept not found.');

    const settings = this.getSettings();
    const brand = localDb.getBrand();

    // Check storage availability
    const storageCheck = ImageValidator.checkLocalStorageAvailability();
    if (!storageCheck.hasSpace) {
      throw new Error(`Not enough local storage to save new image. Available: ${storageCheck.availableMB} MB.`);
    }

    const request: ImageGenerationRequest = {
      id: `img_req_${Date.now()}`,
      contentId: conceptId,
      batchId: concept.generationBatchId,
      prompt: options?.promptText || concept.visualDirection || concept.title,
      style: options?.style || settings.defaultStyle,
      aspectRatio: options?.aspectRatio || settings.defaultAspectRatio,
      quantity: options?.quantity || settings.defaultQuantity,
      brandContext: brand.description,
      additionalInstructions: options?.additionalInstructions,
      createdAt: new Date().toISOString()
    };

    localDb.logActivity('image_generated', 'Image Generation Started', `Started generating image for "${concept.title}".`);

    const provider = new MockImageProvider();
    const generatedAssets = await provider.generateImage(request);

    // Validate generated assets
    const validAssets: MediaAsset[] = [];
    for (const asset of generatedAssets) {
      const val = ImageValidator.validateMediaAsset(asset);
      if (val.isValid) {
        validAssets.push(asset);
        localDb.saveMediaAsset(asset);
      }
    }

    if (validAssets.length === 0) {
      throw new Error('Image generation produced invalid asset files.');
    }

    // Set primary asset and update concept visualUrl & attachedMediaId
    const primaryAsset = validAssets[0];
    concept.visualUrl = primaryAsset.url;
    concept.attachedMediaId = primaryAsset.id;
    concept.updatedAt = new Date().toISOString();

    localDb.updateConceptDetails(concept.id, {
      visualUrl: primaryAsset.url,
      attachedMediaId: primaryAsset.id
    });

    localDb.logActivity('image_generated', 'Image Generation Completed', `Generated ${validAssets.length} image version(s) for "${concept.title}".`);

    return { mediaAssets: validAssets, updatedConcept: concept };
  }

  public async bulkGenerateImages(
    conceptIds: string[],
    onProgress?: (completed: number, total: number, failedCount: number) => void
  ): Promise<{ completedCount: number; failedIds: string[] }> {
    const total = conceptIds.length;
    let completed = 0;
    const failedIds: string[] = [];
    const cancelToken = `bulk_img_${Date.now()}`;

    localDb.logActivity('image_generated', 'Bulk Image Generation Started', `Queued bulk image generation for ${total} concepts.`);

    for (let i = 0; i < total; i++) {
      if (this.activeCancelTokens.has(cancelToken)) {
        this.activeCancelTokens.delete(cancelToken);
        localDb.logActivity('image_generated', 'Bulk Image Generation Cancelled', `Cancelled bulk image job at ${completed}/${total} completed.`);
        break;
      }

      const id = conceptIds[i];
      try {
        await this.generateImageForConcept(id);
        completed++;
      } catch (e) {
        failedIds.push(id);
      }

      if (onProgress) {
        onProgress(completed, total, failedIds.length);
      }

      // Small async delay for UI unblocking
      await new Promise(r => setTimeout(r, 200));
    }

    return { completedCount: completed, failedIds };
  }

  public setPrimaryMediaAsset(conceptId: string, mediaId: string): void {
    const assets = localDb.getMediaAssets().filter(m => m.contentId === conceptId);
    const targetAsset = assets.find(m => m.id === mediaId);

    if (!targetAsset) throw new Error('Target media asset not found.');

    assets.forEach(m => {
      m.isPrimary = m.id === mediaId;
      localDb.saveMediaAsset(m);
    });

    localDb.updateConceptDetails(conceptId, {
      visualUrl: targetAsset.url,
      attachedMediaId: targetAsset.id
    });

    localDb.logActivity('primary_image_changed', 'Primary Image Updated', `Set "${targetAsset.filename}" as primary visual version.`);
  }

  public detachMediaAsset(conceptId: string, mediaId: string): void {
    const concept = localDb.getConcepts().find(c => c.id === conceptId);
    if (concept && concept.attachedMediaId === mediaId) {
      localDb.updateConceptDetails(conceptId, {
        attachedMediaId: undefined
      });
      localDb.logActivity('image_detached', 'Image Detached', `Detached media asset from content.`);
    }
  }

  public deleteMediaAsset(mediaId: string): { success: boolean; wasAttached: boolean } {
    const media = localDb.getMediaAsset(mediaId);
    if (!media) return { success: false, wasAttached: false };

    const attachedConcept = localDb.getConcepts().find(c => c.attachedMediaId === mediaId);
    let wasAttached = false;

    if (attachedConcept) {
      wasAttached = true;
      localDb.updateConceptDetails(attachedConcept.id, {
        attachedMediaId: undefined
      });
    }

    localDb.deleteMediaAsset(mediaId);
    localDb.logActivity('image_deleted', 'Image Deleted', `Deleted asset "${media.filename}".`);
    return { success: true, wasAttached };
  }
}

export const imageEngine = new ImageEngine();
