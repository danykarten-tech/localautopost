import { ImageProvider, ImageProviderStatus } from './ImageProvider';
import { ImageGenerationRequest, MediaAsset } from '../../domain/models/types';

export class MockImageProvider implements ImageProvider {
  id = 'mock_image_provider';
  name = 'Mock Local Image Generator';

  async getStatus(): Promise<ImageProviderStatus> {
    return {
      status: 'connected',
      providerName: 'Mock Image Engine (Demo Local Assets)',
      message: 'Ready for local image generation'
    };
  }

  async checkConnection(): Promise<boolean> {
    return true;
  }

  async generateImage(request: ImageGenerationRequest): Promise<MediaAsset[]> {
    const qty = Math.max(1, request.quantity || 1);
    const mediaAssets: MediaAsset[] = [];

    const mockPool = [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=1080&q=80"
    ];

    for (let i = 0; i < qty; i++) {
      const timestamp = Date.now();
      const filename = `campaign-${request.contentId}-${timestamp}_v${i + 1}.webp`;
      const localPath = `Avenzaq/media/images/generated/${filename}`;
      const imgUrl = mockPool[i % mockPool.length];

      const dims = request.aspectRatio === '1:1' 
        ? { width: 1080, height: 1080 } 
        : request.aspectRatio === '9:16'
        ? { width: 1080, height: 1920 }
        : { width: 1080, height: 1350 }; // default 4:5 for Instagram

      mediaAssets.push({
        id: `media_${timestamp}_${i}`,
        workspaceId: 'ws_northstar_01',
        contentId: request.contentId,
        batchId: request.batchId,
        type: 'image',
        filename,
        localPath,
        mimeType: 'image/webp',
        width: dims.width,
        height: dims.height,
        fileSize: '2.4 MB',
        source: 'generated',
        status: 'completed',
        isPrimary: i === 0,
        version: i + 1,
        url: imgUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return mediaAssets;
  }
}
