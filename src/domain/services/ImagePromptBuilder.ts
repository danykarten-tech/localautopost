import { ImagePromptDetails, ContentObjective, ContentStyle, Brand, AspectRatioType } from '../models/types';

export interface BuildImagePromptRequest {
  brand?: Brand;
  topic: string;
  title?: string;
  hook?: string;
  objective?: ContentObjective;
  style?: ContentStyle | string;
  audience?: string;
  platform?: string;
  contentType?: string;
  aspectRatio?: AspectRatioType | string;
  additionalInstructions?: string;
  brandTone?: string;
  visualDirection?: string;
}

export class ImagePromptBuilder {
  public static buildPrompt(request: BuildImagePromptRequest): ImagePromptDetails {
    const topic = request.topic || request.title || 'Specialty Product';
    const style = request.style || 'Minimal';
    const brandName = request.brand?.description ? request.brand.description.slice(0, 30) : 'Avenzaq Brand';
    const primaryColor = request.brand?.primaryColor || '#7C6CF2';
    const ratio = request.aspectRatio || (request.platform === 'instagram' ? '4:5' : '1:1');

    return {
      subject: `High-end commercial hero shot of ${topic}, focused on craftsmanship and premium details.`,
      composition: style === 'Editorial' 
        ? 'Off-center rule-of-thirds framing with dynamic negative space.'
        : 'Centered symmetrical flat-lay composition with balanced visual weight.',
      environment: 'Artisanal studio setting with raw granite tabletop, natural linen textures, and subtle earthy accents.',
      lighting: 'Soft diffused natural morning daylight casting gentle warm shadows.',
      colorDirection: `Harmonized neutral palette with rich espresso tones, subtle stone grays, and brand accents (${primaryColor}).`,
      brandTreatment: `Sophisticated minimalist brand presence for ${brandName}, emphasizing authenticity and high quality.`,
      typographyGuidance: 'Clean sans-serif overlay typography with generous tracking and high contrast readability.',
      aspectRatio: `${ratio} (${this.getRatioDimensions(ratio)})`
    };
  }

  /**
   * Builds deterministic ChatGPT prompt string for real browser image generation (DALL-E / Visual Creator)
   */
  public static buildStructuredChatGPTImagePrompt(request: BuildImagePromptRequest): string {
    const topic = request.title || request.topic || 'Specialty Commercial Product';
    const hook = request.hook ? `Context: "${request.hook}"` : '';
    const style = request.style || request.visualDirection || 'Editorial commercial photography';
    const ratio = request.aspectRatio || '4:5';
    const dims = this.getRatioDimensions(ratio);
    const brandTone = request.brandTone || request.brand?.brandTone || 'Artisanal & Intelligent';
    const brandName = request.brand?.description ? request.brand.description.slice(0, 40) : 'Avenzaq Workspace';
    const objective = request.objective || 'Product Promotion';
    const extra = request.additionalInstructions ? `Notes: ${request.additionalInstructions}` : '';

    return [
      `Generate a high-resolution commercial visual image for ${brandName}.`,
      `Subject: ${topic}`,
      hook,
      `Objective: ${objective}`,
      `Brand Tone: ${brandTone}`,
      `Visual Style: ${style}`,
      `Aspect Ratio: ${ratio} (${dims})`,
      `Target Platform: ${request.platform || 'Instagram'}`,
      extra,
      `CRITICAL REQUIREMENT: Render and output the exact visual image in ${ratio} aspect ratio. Do not provide textual explanations or conversational preamble.`
    ].filter(Boolean).join('\n');
  }

  public static getRatioDimensions(aspectRatio: AspectRatioType | string): string {
    switch (aspectRatio) {
      case '4:5':
        return '1080x1350 portrait';
      case '1:1':
        return '1080x1080 square';
      case '16:9':
        return '1920x1080 landscape';
      case '9:16':
        return '1080x1920 vertical';
      default:
        return '1080x1350 portrait';
    }
  }
}
