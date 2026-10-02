import { Concept, ContentObjective, ContentStyle } from '../../domain/models/types';

export interface GenerateConceptsRequest {
  objective: ContentObjective;
  quantity: number;
  platform: string;
  style: ContentStyle;
  topic?: string;
  tone?: string;
  instructions?: string;
  brandVoice?: string;
  targetAudience?: string;
  industry?: string;
}

export interface AIStatus {
  status: 'connected' | 'not_connected' | 'needs_attention';
  providerName: string;
  sessionActive: boolean;
  message?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  getStatus(): Promise<AIStatus>;
  connectSession(): Promise<boolean>;
  disconnectSession(): Promise<boolean>;
  generateConcepts(request: GenerateConceptsRequest): Promise<Concept[]>;
  refineCaption(caption: string, instruction: string): Promise<string>;
}
