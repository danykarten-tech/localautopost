import { ImageProvider, ImageProviderStatus } from './ImageProvider';
import { ImageGenerationRequest, MediaAsset } from '../../domain/models/types';
import { localChatGPTExecutor } from '../../domain/services/LocalChatGPTExecutor';
import { localDb } from '../../data/local/database';

export class LocalSessionImageProvider implements ImageProvider {
  id = 'local_session_image';
  name = 'Local ChatGPT Browser Session Image Provider';

  async getStatus(): Promise<ImageProviderStatus> {
    const conn = localDb.getAIConnection();
    const isConnected = conn.status === 'connected';
    return {
      status: isConnected ? 'connected' : 'not_connected',
      providerName: 'Local ChatGPT Session Image Engine',
      message: isConnected 
        ? 'Real Local ChatGPT Session connected and ready for image generation.'
        : 'ChatGPT browser session disconnected. Please connect in AI Studio.'
    };
  }

  async checkConnection(): Promise<boolean> {
    const conn = localDb.getAIConnection();
    return conn.status === 'connected';
  }

  async submitImagePrompt(prompt: string): Promise<string> {
    const res = await localChatGPTExecutor.generateImageWithChatGPT({
      id: `img_req_${Date.now()}`,
      contentId: '',
      prompt,
      style: 'Minimal',
      aspectRatio: '4:5',
      quantity: 1,
      createdAt: new Date().toISOString()
    });
    if (!res.success || res.mediaAssets.length === 0) {
      throw new Error(res.errorMessage || 'Failed to submit image prompt to ChatGPT.');
    }
    return res.mediaAssets[0].id;
  }

  async waitForImage(): Promise<boolean> {
    return true;
  }

  async retrieveImage(): Promise<string> {
    return 'retrieved';
  }

  async saveImage(): Promise<string> {
    return 'saved';
  }

  async generateImage(request: ImageGenerationRequest): Promise<MediaAsset[]> {
    const conn = localDb.getAIConnection();
    if (conn.status !== 'connected') {
      throw new Error('ChatGPT browser session required. Please connect your session in AI Studio.');
    }

    const res = await localChatGPTExecutor.generateImageWithChatGPT(request);
    if (!res.success || res.mediaAssets.length === 0) {
      throw new Error(res.errorMessage || 'Real Local ChatGPT image generation failed.');
    }

    return res.mediaAssets;
  }
}
