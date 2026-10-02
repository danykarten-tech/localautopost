import { MediaAsset } from '../models/types';

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ImageValidator {
  public static validateMediaAsset(asset: Partial<MediaAsset>): ImageValidationResult {
    const errors: string[] = [];

    if (!asset.url && !asset.localPath) {
      errors.push('Image location or path is missing.');
    }

    if (asset.mimeType) {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(asset.mimeType.toLowerCase())) {
        errors.push(`Unsupported image format: ${asset.mimeType}. Supported formats: PNG, JPEG, WEBP.`);
      }
    }

    if (asset.width !== undefined && asset.width <= 0) {
      errors.push('Invalid image width dimensions.');
    }

    if (asset.height !== undefined && asset.height <= 0) {
      errors.push('Invalid image height dimensions.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static checkLocalStorageAvailability(): { hasSpace: boolean; availableMB: number; usedMB: number } {
    try {
      // Estimate LocalStorage capacity (~5-10MB browser limit)
      let totalUsed = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          totalUsed += ((localStorage[x].length + x.length) * 2);
        }
      }
      const usedMB = totalUsed / (1024 * 1024);
      const estimatedLimitMB = 10;
      const availableMB = Math.max(0, estimatedLimitMB - usedMB);

      return {
        hasSpace: availableMB > 0.5,
        availableMB: parseFloat(availableMB.toFixed(2)),
        usedMB: parseFloat(usedMB.toFixed(2))
      };
    } catch (e) {
      return { hasSpace: true, availableMB: 5.0, usedMB: 0.5 };
    }
  }
}
