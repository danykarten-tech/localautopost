import { AIProvider, AIStatus, GenerateConceptsRequest } from './AIProvider';
import { Concept } from '../../domain/models/types';
import { ImagePromptBuilder } from '../../domain/services/ImagePromptBuilder';
import { ContentQualityValidator } from '../../domain/services/ContentQualityValidator';
import { localDb } from '../../data/local/database';

export class MockAIProvider implements AIProvider {
  id = 'mock';
  name = 'Mock Local AI Generator';

  async getStatus(): Promise<AIStatus> {
    return {
      status: 'connected',
      providerName: 'Mock Local AI Engine (MOCK PROVIDER ACTIVE)',
      sessionActive: true,
      message: 'Generating simulated local concepts for workstation'
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

    // Retrieve Brand Kit Context & Workspace
    const brand = localDb.getBrand();
    const workspace = localDb.getWorkspace();
    const brandVoice = request.brandVoice || brand.toneOfVoice || brand.brandTone || 'Artisanal, intelligent, warm';
    const audience = request.targetAudience || brand.targetAudience || 'Discerning enthusiasts';
    const pillarsList = brand.contentPillars || [];
    const pillars = pillarsList.length > 0 ? pillarsList.join(', ') : 'Product craftsmanship, Education';
    const forbiddenKws = brand.forbiddenKeywords || [];

    const sampleImages = [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80"
    ];

    const anglePrefixes = [
      "Mastering", "Behind the Scenes with", "3 Critical Myths About", 
      "The Essential Guide to", "Why Top Creators Value", "Avoiding Costly Mistakes in", 
      "The Science Behind Perfect", "5 Practical Upgrades for", "Unlocking Full Potential in", 
      "An Insider's Perspective on", "Step-by-Step Breakdown of", "Transforming Your Daily Routine with",
      "Core Fundamentals of", "The Golden Rule of", "Advanced Techniques in"
    ];

    const hookTemplates = [
      `Stop burning your energy on outdated methods for {topic}. Here is the exact framework we use for {audience}.`,
      `Did you know that 85% of people get {topic} completely wrong? Let's fix that today.`,
      `Here is a peek behind the curtain of our {topic} process — tailored with {brandVoice} craftsmanship.`,
      `If you care about {topic}, these 3 simple adjustments will change your results instantly.`,
      `Why settle for average {topic} when you can achieve master-level quality in 3 minutes?`,
      `We analyzed what makes {topic} truly stand out. Here are the 3 non-negotiables for {audience}.`
    ];

    for (let i = 0; i < count; i++) {
      const prefix = anglePrefixes[i % anglePrefixes.length];
      const cycle = Math.floor(i / anglePrefixes.length);
      const cycleTag = cycle > 0 ? ` (Part ${cycle + 1})` : '';

      const title = `${prefix} ${topic}${cycleTag}`;
      
      const rawHook = hookTemplates[i % hookTemplates.length];
      const hook = rawHook
        .replace(/{topic}/g, topic)
        .replace(/{audience}/g, audience)
        .replace(/{brandVoice}/g, brandVoice);

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

      const fullCaption = `${hook}\n\nWhen exploring ${topic}, attention to detail defines the outcome. Crafted in our ${brandVoice} brand voice for ${audience}, this post breaks down key insights.\n\n3 Core Takeaways:\n1. Align with brand pillars: ${pillars}.\n2. Prioritize precise execution over shortcuts.\n3. Focus on consistent quality standards.\n\nWhat is your biggest takeaway regarding ${topic}? Let us know in the comments below! 👇`;

      const conceptPartial: Partial<Concept> = {
        title,
        hook,
        fullCaption,
        cta: `Save & share this ${topic} guide with your team!`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, `#${workspace.name.replace(/\s+/g, '')}`, '#AvenzaqAutopilot', `#${objective.replace(/\s+/g, '')}`]
      };

      const qualityReport = ContentQualityValidator.validateConcept(conceptPartial, results, forbiddenKws);

      results.push({
        id: `cncpt_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
        conceptNumber: i + 1,
        title,
        hook,
        captionPreview: fullCaption.slice(0, 110) + '...',
        fullCaption,
        cta: conceptPartial.cta!,
        hashtags: conceptPartial.hashtags!,
        contentType: i % 2 === 0 ? 'Carousel Post' : 'Single Image Post',
        visualDirection: `${style} aesthetic photography highlighting ${topic} with ${brandVoice} visual tone.`,
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
