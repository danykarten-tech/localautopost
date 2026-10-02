import { AIProvider, AIStatus, GenerateConceptsRequest } from './AIProvider';
import { Concept } from '../../domain/models/types';

export class APIProvider implements AIProvider {
  id = 'api_provider';
  name = 'API Key Connection';

  async getStatus(): Promise<AIStatus> {
    return {
      status: 'not_connected',
      providerName: 'Custom API Key Provider',
      sessionActive: false,
      message: 'No external API key provided'
    };
  }

  async connectSession(): Promise<boolean> {
    throw new Error('API key configuration requires a valid key.');
  }

  async disconnectSession(): Promise<boolean> {
    return true;
  }

  async generateConcepts(_request: GenerateConceptsRequest): Promise<Concept[]> {
    throw new Error('API key not configured in Phase 1.');
  }

  async refineCaption(_caption: string, _instruction: string): Promise<string> {
    throw new Error('API key not configured in Phase 1.');
  }
}
