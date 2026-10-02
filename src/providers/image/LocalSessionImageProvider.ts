import { ImageProvider, ImageProviderStatus } from './ImageProvider';
import { ImageGenerationRequest, MediaAsset } from '../../domain/models/types';

export class LocalSessionImageProvider implements ImageProvider {
  id = 'local_session_image';
  name = 'Local Session Image Provider Boundary';

  async getStatus(): Promise<ImageProviderStatus> {
    return {
      status: 'not_connected',
      providerName: 'Local Session Image Provider (Phase 6 Boundary)',
      message: 'Local browser session image generation boundary prepared for Phase 6.'
    };
  }

  async checkConnection(): Promise<boolean> {
    return false;
  }

  async submitImagePrompt(_prompt: string): Promise<string> {
    throw new Error('LocalSessionImageProvider boundary not active in Phase 5.');
  }

  async waitForImage(): Promise<boolean> {
    return false;
  }

  async retrieveImage(): Promise<string> {
    throw new Error('Not implemented in Phase 5.');
  }

  async saveImage(): Promise<string> {
    throw new Error('Not implemented in Phase 5.');
  }

  async generateImage(_request: ImageGenerationRequest): Promise<MediaAsset[]> {
    throw new Error('LocalSessionImageProvider boundary not configured. Select MockImageProvider.');
  }
}
