export type ContentStatus = 'draft' | 'pending' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'failed';

export type PlatformType = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'twitter';

export type ContentObjective = 
  | 'Product Promotion' 
  | 'Educational' 
  | 'Engagement' 
  | 'Brand Awareness' 
  | 'Storytelling' 
  | 'Seasonal' 
  | 'Offer' 
  | 'Custom';

export type ContentStyle = 
  | 'Minimal' 
  | 'Editorial' 
  | 'Bold' 
  | 'Premium' 
  | 'Lifestyle' 
  | 'Educational' 
  | 'Custom';

export type ImageStyle = 
  | 'Photorealistic'
  | 'Editorial'
  | 'Minimal'
  | 'Premium'
  | 'Lifestyle'
  | 'Product Photography'
  | '3D'
  | 'Illustration'
  | 'Custom';

export type AspectRatioType = '1:1' | '4:5' | '16:9' | '9:16';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  businessName: string;
  website: string;
  industry: string;
  isCompletedOnboarding: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  workspaceId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
  targetAudience: string;
  brandTone: string;
  visualStyle: string;
  contentRules: string[];
}

export interface ImagePromptDetails {
  subject: string;
  composition: string;
  environment: string;
  lighting: string;
  colorDirection: string;
  brandTreatment: string;
  typographyGuidance: string;
  aspectRatio: string;
}

export interface Concept {
  id: string;
  generationBatchId?: string;
  conceptNumber: number;
  title: string;
  hook: string;
  captionPreview: string;
  fullCaption: string;
  cta: string;
  hashtags: string[];
  contentType: string;
  visualDirection: string;
  imagePrompt?: ImagePromptDetails;
  qualityScore?: number;
  qualityIssues?: string[];
  platform: PlatformType;
  status: ContentStatus;
  visualUrl: string;
  attachedMediaId?: string;
  objective: ContentObjective;
  style: ContentStyle;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerationBatch {
  id: string;
  workspaceId: string;
  name: string;
  platform: PlatformType;
  objective: ContentObjective;
  topic: string;
  requestedQuantity: number;
  completedQuantity: number;
  failedQuantity: number;
  approvedQuantity: number;
  pendingQuantity: number;
  rejectedQuantity: number;
  status: 'queued' | 'generating' | 'partiallyCompleted' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface GenerationChunk {
  id: string;
  generationBatchId: string;
  chunkNumber: number;
  requestedQuantity: number;
  completedQuantity: number;
  failedQuantity: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface ContentRequest {
  id: string;
  workspaceId: string;
  platform: PlatformType;
  objective: ContentObjective;
  topic: string;
  quantity: number;
  tone: string;
  style: ContentStyle;
  audience?: string;
  language?: string;
  additionalInstructions?: string;
  brandContext?: string;
  generationBatchId?: string;
  createdAt: string;
}

export interface ImageGenerationRequest {
  id: string;
  contentId: string;
  batchId?: string;
  prompt: string | ImagePromptDetails;
  style: ImageStyle | string;
  aspectRatio: AspectRatioType | string;
  quantity: number;
  brandContext?: string;
  additionalInstructions?: string;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  workspaceId: string;
  contentId?: string;
  batchId?: string;
  type: 'image' | 'video';
  filename: string;
  localPath: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: string;
  source: 'generated' | 'uploaded' | 'imported';
  status: 'completed' | 'failed' | 'processing';
  isPrimary?: boolean;
  version?: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageJob {
  id: string;
  contentId: string;
  batchId?: string;
  request: ImageGenerationRequest;
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed' | 'cancelled';
  generatedMediaIds: string[];
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ImageEngineSettings {
  provider: 'mock' | 'local_session' | 'api';
  defaultStyle: ImageStyle | string;
  defaultAspectRatio: AspectRatioType | string;
  defaultQuantity: number;
  autoGenerateAfterApproval: boolean;
  maxConcurrentJobs: number;
}

export interface ContentItem {
  id: string;
  workspaceId: string;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  platform: PlatformType;
  contentType: string;
  status: ContentStatus;
  visualUrl: string;
  visualDirection: string;
  scheduledDate?: string;
  scheduledTime?: string;
  conceptId?: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  category: 'generated' | 'uploaded';
  isUsed: boolean;
  fileSize: string;
  createdAt: string;
}

export interface AutomationNode {
  id: string;
  title: string;
  subtitle: string;
  type: 'trigger' | 'action' | 'condition';
  status: 'active' | 'waiting' | 'idle';
}

export interface AutomationRule {
  id: string;
  name: string;
  frequency: string;
  time: string;
  action: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface AutomationConfig {
  id: string;
  workspaceId: string;
  isEnabled: boolean;
  frequency: string;
  postingDays: string[];
  postingTime: string;
  contentQuantity: number;
  approvalRequired: boolean;
  localModeNotice: string;
}

export interface SocialAccount {
  id: string;
  platform: PlatformType;
  platformName: string;
  handle?: string;
  status: 'connected' | 'not_connected' | 'needs_attention';
  accountType?: string;
  followerCount?: string;
  connectedAt?: string;
  isAvailableInPhase1: boolean;
}

export interface AIConnectionConfig {
  id: string;
  providerType: 'local_session' | 'api_key' | 'mock';
  providerName: string;
  status: 'connected' | 'not_connected' | 'needs_attention';
  modelName: string;
  lastTested?: string;
  environmentName: string;
  isSessionActive: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'concept_generated' | 'approved' | 'scheduled' | 'rejected' | 'account_connected' | 'automation_triggered' | 'image_generated' | 'image_attached' | 'image_detached' | 'image_deleted' | 'primary_image_changed';
  title: string;
  description: string;
  timestamp: string;
}

export interface NotificationsState {
  unreadCount: number;
  items: {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'info' | 'success' | 'warning';
  }[];
}
