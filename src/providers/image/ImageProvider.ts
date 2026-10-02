import { ImageGenerationRequest, MediaAsset } from '../../domain/models/types';

export interface ImageProviderStatus {
  status: 'connected' | 'not_connected' | 'needs_attention';
  providerName: string;
  message?: string;
}

export interface ImageProvider {
  id: string;
  name: string;
  getStatus(): Promise<ImageProviderStatus>;
  checkConnection(): Promise<boolean>;
  generateImage(request: ImageGenerationRequest): Promise<MediaAsset[]>;
  getGenerationStatus?(jobId: string): Promise<string>;
  cancelGeneration?(jobId: string): Promise<boolean>;
}
