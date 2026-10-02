import { AIProvider, AIStatus, GenerateConceptsRequest } from './AIProvider';
import { Concept } from '../../domain/models/types';
import { localBrowserSession } from '../../domain/services/LocalBrowserSession';

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
    return localBrowserSession.generateConcepts(request);
  }

  async refineCaption(caption: string, instruction: string): Promise<string> {
    return `${caption}\n\n[Refined via Local ChatGPT Session: "${instruction}"]\n✨ Optimized for maximum audience engagement.`;
  }
}
