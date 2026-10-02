import { AIProvider, AIStatus, GenerateConceptsRequest } from './AIProvider';
import { Concept } from '../../domain/models/types';

export class LocalSessionAIProvider implements AIProvider {
  id = 'local_session';
  name = 'Local Session AI Provider Boundary';

  async getStatus(): Promise<AIStatus> {
    return {
      status: 'not_connected',
      providerName: 'Local Session AI Provider Boundary (Phase 4)',
      sessionActive: false,
      message: 'Local browser session engine boundary prepared for Phase 4.'
    };
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Local Session browser scraping boundary will be activated in Phase 4.' };
  }

  async checkConnection(): Promise<boolean> {
    return false;
  }

  async submitPrompt(_prompt: string): Promise<string> {
    throw new Error('LocalSessionAIProvider boundary not activated in Phase 3.');
  }

  async waitForResponse(): Promise<boolean> {
    return false;
  }

  async retrieveResponse(): Promise<string> {
    throw new Error('Not implemented in Phase 3.');
  }

  async disconnect(): Promise<boolean> {
    return true;
  }

  async connectSession(): Promise<boolean> {
    return false;
  }

  async disconnectSession(): Promise<boolean> {
    return true;
  }

  async generateConcepts(_request: GenerateConceptsRequest): Promise<Concept[]> {
    throw new Error('LocalSessionAIProvider boundary not activated in Phase 3. Use MockAIProvider.');
  }

  async refineCaption(_caption: string, _instruction: string): Promise<string> {
    throw new Error('LocalSessionAIProvider boundary not activated in Phase 3.');
  }
}
