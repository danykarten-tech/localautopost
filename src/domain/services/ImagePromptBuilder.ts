import { ImagePromptDetails, ContentObjective, ContentStyle, Brand } from '../models/types';

export interface BuildImagePromptRequest {
  brand?: Brand;
  topic: string;
  objective: ContentObjective;
  style: ContentStyle;
  audience?: string;
  platform: string;
  contentType: string;
}

export class ImagePromptBuilder {
  public static buildPrompt(request: BuildImagePromptRequest): ImagePromptDetails {
    const topic = request.topic || 'Specialty Product';
    const style = request.style || 'Minimal';
    const brandName = request.brand?.description ? request.brand.description.slice(0, 30) : 'Avenzaq Brand';
    const primaryColor = request.brand?.primaryColor || '#7C6CF2';

    return {
      subject: `High-end commercial hero shot of ${topic}, focused on craftsmanship and premium details.`,
      composition: style === 'Editorial' 
        ? 'Off-center rule-of-thirds framing with dynamic negative space.'
        : 'Centered symmetrical flat-lay composition with balanced visual weight.',
      environment: 'Artisanal studio setting with raw granite tabletop, natural linen textures, and subtle earthy accents.',
      lighting: 'Soft diffused natural morning daylight casting gentle warm shadows.',
      colorDirection: `Harmanized neutral palette with rich espresso tones, subtle stone grays, and brand accent accents (${primaryColor}).`,
      brandTreatment: `Sophisticated minimalist brand presence for ${brandName}, emphasizing authenticity and high quality.`,
      typographyGuidance: 'Clean sans-serif overlay typography with generous tracking and high contrast readability.',
      aspectRatio: request.platform === 'instagram' ? '4:5 (1080x1350)' : '1:1 (1080x1080)'
    };
  }
}
