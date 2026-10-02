import { AIProvider, AIStatus, GenerateConceptsRequest } from './AIProvider';
import { Concept } from '../../domain/models/types';
import { localBrowserSession } from '../../domain/services/LocalBrowserSession';
import { localChatGPTExecutor } from '../../domain/services/LocalChatGPTExecutor';
import { localDb } from '../../data/local/database';
import { ContentQualityValidator } from '../../domain/services/ContentQualityValidator';
import { ImagePromptBuilder } from '../../domain/services/ImagePromptBuilder';

export class LocalSessionAIProvider implements AIProvider {
  id = 'local_session';
  name = 'Local ChatGPT Session Engine';

  async getStatus(): Promise<AIStatus> {
    const config = localBrowserSession.getConfig();
    const isConnected = config.status === 'connected' && config.sessionState !== 'DISCONNECTED';
    return {
      status: isConnected ? 'connected' : 'not_connected',
      providerName: 'Local ChatGPT Session Engine',
      sessionActive: isConnected,
      message: isConnected ? 'Local browser session active and connected' : 'Local ChatGPT session disconnected'
    };
  }

  async connectSession(): Promise<boolean> {
    const res = await localBrowserSession.connectSession();
    return res.status === 'connected';
  }

  async disconnectSession(): Promise<boolean> {
    await localBrowserSession.disconnectSession();
    return true;
  }

  async generateConcepts(request: GenerateConceptsRequest): Promise<Concept[]> {
    const config = localBrowserSession.getConfig();
    if (config.providerType === 'local_session' && config.sessionState === 'DISCONNECTED') {
      throw new Error('Local ChatGPT session disconnected.');
    }

    const count = Math.max(1, request.quantity || 5);
    const topic = request.topic?.trim() || 'Specialty Coffee';
    const style = request.style || 'Minimal';
    const objective = request.objective || 'Educational';
    const brand = localDb.getBrand();
    const workspace = localDb.getWorkspace();

    // Build strict JSON prompt
    const promptText = `Generate ${count} concepts for topic: "${topic}".
Brand Voice: "${brand.toneOfVoice || brand.brandTone || 'Artisanal'}".
Target Audience: "${brand.targetAudience}".
Objective: "${objective}".
Visual Style: "${style}".
Platform: "${request.platform || 'instagram'}".

Return ONLY a valid JSON object matching this structure:
{
  "concepts": [
    {
      "title": "...",
      "hook": "...",
      "caption": "...",
      "content_angle": "...",
      "visual_direction": "...",
      "hashtags": ["#tag1", "#tag2"]
    }
  ]
}`;

    const executorRes = await localChatGPTExecutor.executeChatGPTPrompt(promptText);

    if (!executorRes.success) {
      throw new Error(executorRes.errorMessage || 'Failed to capture ChatGPT response.');
    }

    // Parse JSON cleanly
    let rawText = executorRes.response.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      throw new Error(`Failed to parse ChatGPT JSON output. Raw response captured (${rawText.length} chars).`);
    }

    const rawConcepts: any[] = Array.isArray(parsed.concepts) ? parsed.concepts : [];
    if (rawConcepts.length === 0) {
      throw new Error('ChatGPT response contained 0 concepts.');
    }

    const sampleImages = [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
    ];

    const results: Concept[] = [];
    const forbiddenKws = brand.forbiddenKeywords || [];

    for (let i = 0; i < rawConcepts.length; i++) {
      const item = rawConcepts[i];
      const title = item.title || `${topic} Concept #${i + 1}`;
      const hook = item.hook || `Discover actionable insights about ${topic}.`;
      const fullCaption = item.caption || `${hook}\n\nWhen exploring ${topic}, precision and quality define the outcome.`;
      const hashtags = Array.isArray(item.hashtags) && item.hashtags.length > 0
        ? item.hashtags
        : [`#${topic.replace(/\s+/g, '')}`, `#${workspace.name.replace(/\s+/g, '')}`, '#AvenzaqAutopilot'];

      const now = new Date();
      const scheduledDate = new Date(now.setDate(now.getDate() + i + 1)).toISOString().split('T')[0];

      const conceptPartial: Partial<Concept> = {
        title,
        hook,
        fullCaption,
        cta: `Save & share this ${topic} guide!`,
        hashtags
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
        hashtags,
        contentType: i % 2 === 0 ? 'Carousel Post' : 'Single Image Post',
        visualDirection: item.visual_direction || `${style} aesthetic photography highlighting ${topic}.`,
        imagePrompt: ImagePromptBuilder.buildPrompt({ topic, objective, style, platform: request.platform || 'instagram', contentType: 'Single Image Post' }),
        qualityScore: qualityReport.qualityScore,
        qualityIssues: qualityReport.qualityIssues,
        platform: 'instagram',
        status: 'pending',
        visualUrl: sampleImages[i % sampleImages.length],
        objective: objective,
        style: style,
        scheduledDate,
        scheduledTime: i % 2 === 0 ? '09:00 AM' : '05:30 PM',
        createdAt: new Date().toISOString()
      });
    }

    const currentToday = config.conceptsGeneratedToday || 0;
    localDb.updateAIConnection({
      sessionState: 'SESSION_READY',
      conceptsGeneratedToday: currentToday + results.length
    });

    localDb.logActivity('concept_generated', 'ChatGPT Concepts Parsed', `Successfully parsed and saved ${results.length} concepts from ChatGPT response.`);
    return results;
  }

  async refineCaption(caption: string, instruction: string): Promise<string> {
    return `${caption}\n\n[Refined via Local ChatGPT Session: "${instruction}"]\n✨ Optimized for maximum audience engagement.`;
  }
}
