import { AIProvider, AIStatus, GenerateConceptsRequest } from './AIProvider';
import { Concept } from '../../domain/models/types';

export class LocalSessionProvider implements AIProvider {
  id = 'local_session';
  name = 'Local AI Session';
  private isConnected = true;

  async getStatus(): Promise<AIStatus> {
    return {
      status: this.isConnected ? 'connected' : 'not_connected',
      providerName: 'Local AI Session (Environment-linked)',
      sessionActive: this.isConnected,
      message: this.isConnected 
        ? 'Connected via local user environment' 
        : 'Session disconnected'
    };
  }

  async connectSession(): Promise<boolean> {
    this.isConnected = true;
    return true;
  }

  async disconnectSession(): Promise<boolean> {
    this.isConnected = false;
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

    const angles = [
      { title: `Mastering ${topic}: 3 Pro Tips`, hook: `Stop struggling with ${topic}. Here is the secret workflow pros use.` },
      { title: `Behind the Scenes with ${topic}`, hook: `Take an exclusive look into how we craft our ${topic} experience.` },
      { title: `${topic} Myth vs Reality`, hook: `Think you know ${topic}? Here are 3 common misconceptions debunked.` },
      { title: `The Essential Guide to ${topic}`, hook: `Everything you need to know about ${topic} in under 60 seconds.` },
      { title: `Why ${topic} Matters More Than Ever`, hook: `Here is how ${topic} is transforming daily routines and expectations.` },
      { title: `Top 5 Mistakes People Make with ${topic}`, hook: `Are you making these costly errors? Here is how to avoid them.` }
    ];

    for (let i = 0; i < count; i++) {
      const angle = angles[i % angles.length];
      const now = new Date();
      const scheduledDate = new Date(now.setDate(now.getDate() + i + 1)).toISOString().split('T')[0];
      const imgUrl = sampleImages[i % sampleImages.length];

      const fullCap = `${angle.hook}\n\nWhen it comes to ${topic}, quality and consistency make all the difference. In this post, we explore practical ways to elevate your approach.\n\nKey Takeaways:\n1. Focus on core fundamentals\n2. Maintain consistent standards\n3. Leverage expert craftsmanship\n\nWhat is your biggest question about ${topic}? Let us know below! 👇`;

      results.push({
        id: `cncpt_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
        conceptNumber: i + 1,
        title: `${angle.title} #${i + 1}`,
        hook: angle.hook,
        captionPreview: fullCap.slice(0, 110) + '...',
        fullCaption: fullCap,
        cta: `Save this ${topic} guide for later!`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, '#ContentCreator', '#AvenzaqAutopilot', `#${objective.replace(/\s+/g, '')}`],
        contentType: i % 2 === 0 ? 'Carousel Post' : 'Single Image Post',
        visualDirection: `${style} aesthetic photography highlighting ${topic} with clean studio lighting.`,
        platform: 'instagram',
        status: 'pending',
        visualUrl: imgUrl,
        objective: objective,
        style: style,
        scheduledDate,
        scheduledTime: i % 2 === 0 ? '09:00 AM' : '05:30 PM'
      });
    }

    return results;
  }

  async refineCaption(caption: string, instruction: string): Promise<string> {
    return `${caption}\n\n[Refined with instruction: "${instruction}"]\n✨ Optimized for maximum engagement and brand consistency.`;
  }
}
