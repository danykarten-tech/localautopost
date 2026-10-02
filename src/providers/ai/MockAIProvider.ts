import { AIProvider, AIStatus, GenerateConceptsRequest } from './AIProvider';
import { Concept } from '../../domain/models/types';
import { ImagePromptBuilder } from '../../domain/services/ImagePromptBuilder';
import { ContentQualityValidator } from '../../domain/services/ContentQualityValidator';

export class MockAIProvider implements AIProvider {
  id = 'mock';
  name = 'Mock Local AI Generator';

  async getStatus(): Promise<AIStatus> {
    return {
      status: 'connected',
      providerName: 'Mock Local AI Engine (Phase 3)',
      sessionActive: true,
      message: 'Ready for local generation'
    };
  }

  async connectSession(): Promise<boolean> {
    return true;
  }

  async disconnectSession(): Promise<boolean> {
    return false;
  }

  async generateConcepts(request: GenerateConceptsRequest): Promise<Concept[]> {
    const count = Math.max(1, request.quantity || 5);
    const results: Concept[] = [];
    const topic = request.topic?.trim() || 'Specialty Coffee';
    const style = request.style || 'Minimal';
    const objective = request.objective || 'Educational';

    const sampleImages = [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80"
    ];

    const angleTemplates = [
      { t: `3 Secrets to Master ${topic}`, h: `Stop burning your time with ${topic}! Here is the 30-second fix pros use.` },
      { t: `Behind the Scenes: Crafting ${topic}`, h: `From raw ingredients to perfection — how we build our ${topic} experience.` },
      { t: `${topic} Myth vs Reality`, h: `Think you know ${topic}? Here are 3 common misconceptions debunked.` },
      { t: `The Essential Guide to ${topic}`, h: `Everything you need to know about ${topic} in one quick read.` },
      { t: `Why ${topic} Matters More Than Ever`, h: `Here is how ${topic} is quietly transforming daily routines.` },
      { t: `Top Mistakes to Avoid in ${topic}`, h: `Are you making these 3 common errors? Here is how to fix them.` },
      { t: `The Science of Perfect ${topic}`, h: `Understanding the key principles behind consistent ${topic} quality.` },
      { t: `5 Quick Wins for ${topic} Enthusiasts`, h: `Upgrade your daily ${topic} setup with these simple adjustments.` }
    ];

    for (let i = 0; i < count; i++) {
      const template = angleTemplates[i % angleTemplates.length];
      const batchSuffix = Math.floor(i / angleTemplates.length) > 0 ? ` (Vol. ${Math.floor(i / angleTemplates.length) + 1})` : '';
      const title = `${template.t}${batchSuffix} #${i + 1}`;
      const hook = template.h;

      const now = new Date();
      const scheduledDate = new Date(now.setDate(now.getDate() + i + 1)).toISOString().split('T')[0];
      const imgUrl = sampleImages[i % sampleImages.length];

      const imagePrompt = ImagePromptBuilder.buildPrompt({
        topic,
        objective,
        style,
        platform: request.platform || 'instagram',
        contentType: i % 2 === 0 ? 'Carousel Post' : 'Single Image Post'
      });

      const fullCaption = `${hook}\n\nWhen it comes to ${topic}, small details make all the difference. In this post, we share actionable insights tailored for ${request.tone || 'modern creators'}.\n\n3 Quick Takeaways:\n1. Focus on core fundamentals\n2. Maintain consistent quality standards\n3. Pay attention to subtle refinements\n\nWhat is your current approach to ${topic}? Share in the comments below! 👇`;

      const conceptPartial: Partial<Concept> = {
        title,
        hook,
        fullCaption,
        cta: `Save this ${topic} guide for your next session!`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, '#ContentCreator', '#AvenzaqAutopilot', `#${objective.replace(/\s+/g, '')}`]
      };

      const qualityReport = ContentQualityValidator.validateConcept(conceptPartial, results);

      results.push({
        id: `cncpt_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
        generationBatchId: request.brandVoice ? 'batch_custom' : undefined,
        conceptNumber: i + 1,
        title,
        hook,
        captionPreview: fullCaption.slice(0, 110) + '...',
        fullCaption,
        cta: conceptPartial.cta!,
        hashtags: conceptPartial.hashtags!,
        contentType: i % 2 === 0 ? 'Carousel Post' : 'Single Image Post',
        visualDirection: `${style} aesthetic photography highlighting ${topic} with clean lighting.`,
        imagePrompt,
        qualityScore: qualityReport.qualityScore,
        qualityIssues: qualityReport.qualityIssues,
        platform: 'instagram',
        status: 'pending',
        visualUrl: imgUrl,
        objective: objective,
        style: style,
        scheduledDate,
        scheduledTime: i % 2 === 0 ? '09:00 AM' : '05:30 PM',
        createdAt: new Date().toISOString()
      });
    }

    return results;
  }

  async refineCaption(caption: string, instruction: string): Promise<string> {
    return `${caption}\n\n[Refined with instruction: "${instruction}"]\n✨ Optimized for maximum engagement and brand consistency.`;
  }
}
