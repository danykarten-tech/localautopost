import { 
  Workspace, 
  Brand, 
  Concept, 
  MediaItem, 
  AutomationConfig, 
  SocialAccount, 
  AIConnectionConfig, 
  ActivityItem,
  ContentStatus,
  GenerationBatch,
  MediaAsset,
  PublishJob 
} from '../../domain/models/types';

import { 
  SEED_WORKSPACE, 
  SEED_BRAND, 
  SEED_CONCEPTS, 
  SEED_MEDIA, 
  SEED_AUTOMATION, 
  SEED_SOCIAL_ACCOUNTS, 
  SEED_AI_CONNECTION, 
  SEED_ACTIVITIES 
} from './seedData';

const STORAGE_KEYS = {
  WORKSPACE: 'avenzaq_workspace',
  BRAND: 'avenzaq_brand',
  CONCEPTS: 'avenzaq_concepts',
  MEDIA: 'avenzaq_media',
  MEDIA_ASSETS: 'avenzaq_media_assets',
  AUTOMATION: 'avenzaq_automation',
  SOCIAL_ACCOUNTS: 'avenzaq_social_accounts',
  AI_CONNECTION: 'avenzaq_ai_connection',
  ACTIVITIES: 'avenzaq_activities',
  THEME: 'avenzaq_theme',
  BATCHES: 'avenzaq_generation_batches',
  LAST_QUANTITY: 'avenzaq_last_quantity',
  PUBLISH_JOBS: 'avenzaq_publish_jobs'
};

class LocalDatabase {
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.WORKSPACE)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, JSON.stringify(SEED_WORKSPACE));
    localStorage.setItem(STORAGE_KEYS.BRAND, JSON.stringify(SEED_BRAND));
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(SEED_CONCEPTS));
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(SEED_MEDIA));
    localStorage.setItem(STORAGE_KEYS.AUTOMATION, JSON.stringify(SEED_AUTOMATION));
    localStorage.setItem(STORAGE_KEYS.SOCIAL_ACCOUNTS, JSON.stringify(SEED_SOCIAL_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.AI_CONNECTION, JSON.stringify(SEED_AI_CONNECTION));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Workspace
  public getWorkspace(): Workspace {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKSPACE);
    return raw ? JSON.parse(raw) : SEED_WORKSPACE;
  }

  public updateWorkspace(data: Partial<Workspace>): Workspace {
    const current = this.getWorkspace();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, JSON.stringify(updated));
    this.notify();
    return updated;
  }

  // Brand
  public getBrand(): Brand {
    const raw = localStorage.getItem(STORAGE_KEYS.BRAND);
    return raw ? JSON.parse(raw) : SEED_BRAND;
  }

  public updateBrand(data: Partial<Brand>): Brand {
    const current = this.getBrand();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.BRAND, JSON.stringify(updated));
    this.notify();
    return updated;
  }

  // Concepts / Content
  public getConcepts(): Concept[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
    return raw ? JSON.parse(raw) : SEED_CONCEPTS;
  }

  public addConcepts(newConcepts: Concept[]) {
    const current = this.getConcepts();
    const updated = [...newConcepts, ...current];
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(updated));
    this.logActivity(
      'concept_generated',
      'Generated New Concepts',
      `Created ${newConcepts.length} content concepts in workspace.`
    );
    this.notify();
  }

  public updateConceptStatus(id: string, status: ContentStatus, scheduledDate?: string, scheduledTime?: string) {
    const current = this.getConcepts();
    const updated = current.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          ...(scheduledDate && { scheduledDate }),
          ...(scheduledTime && { scheduledTime })
        };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(updated));

    const item = current.find(c => c.id === id);
    if (item) {
      this.logActivity(
        status === 'approved' ? 'approved' : status === 'scheduled' ? 'scheduled' : 'rejected',
        `Concept ${status.toUpperCase()}`,
        `"${item.title}" status updated to ${status}.`
      );
    }
    this.notify();
  }

  public updateConceptDetails(id: string, data: Partial<Concept>) {
    const current = this.getConcepts();
    const updated = current.map(c => (c.id === id ? { ...c, ...data } : c));
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(updated));
    this.notify();
  }

  public bulkUpdateStatus(ids: string[], status: ContentStatus) {
    const current = this.getConcepts();
    const updated = current.map(c => (ids.includes(c.id) ? { ...c, status } : c));
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(updated));
    this.logActivity(
      status === 'approved' ? 'approved' : 'rejected',
      `Bulk ${status.toUpperCase()} Action`,
      `Updated ${ids.length} concepts to ${status}.`
    );
    this.notify();
  }

  // Media
  public getMedia(): MediaItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDIA);
    return raw ? JSON.parse(raw) : SEED_MEDIA;
  }

  public addMediaItem(item: MediaItem) {
    const current = this.getMedia();
    const updated = [item, ...current];
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(updated));
    this.notify();
  }

  public deleteMediaItem(id: string) {
    const current = this.getMedia();
    const updated = current.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(updated));
    this.notify();
  }

  // Automation
  public getAutomation(): AutomationConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTOMATION);
    return raw ? JSON.parse(raw) : SEED_AUTOMATION;
  }

  public updateAutomation(data: Partial<AutomationConfig>) {
    const current = this.getAutomation();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.AUTOMATION, JSON.stringify(updated));
    this.notify();
  }

  // Social Accounts
  public getSocialAccounts(): SocialAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SOCIAL_ACCOUNTS);
    return raw ? JSON.parse(raw) : SEED_SOCIAL_ACCOUNTS;
  }

  public updateSocialAccountStatus(id: string, status: 'connected' | 'not_connected' | 'needs_attention') {
    const current = this.getSocialAccounts();
    const updated = current.map(s => (s.id === id ? { ...s, status } : s));
    localStorage.setItem(STORAGE_KEYS.SOCIAL_ACCOUNTS, JSON.stringify(updated));
    this.notify();
  }

  // AI Connection
  public getAIConnection(): AIConnectionConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_CONNECTION);
    return raw ? JSON.parse(raw) : SEED_AI_CONNECTION;
  }

  public updateAIConnection(data: Partial<AIConnectionConfig>): AIConnectionConfig {
    const current = this.getAIConnection();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.AI_CONNECTION, JSON.stringify(updated));
    this.notify();
    return updated;
  }

  // Activities
  public getActivities(): ActivityItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return raw ? JSON.parse(raw) : SEED_ACTIVITIES;
  }

  public logActivity(type: ActivityItem['type'], title: string, description: string) {
    const current = this.getActivities();
    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      type,
      title,
      description,
      timestamp: 'Just now'
    };
    const updated = [newActivity, ...current.slice(0, 15)];
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
  }

  // Generation Batches
  public getGenerationBatches(): GenerationBatch[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BATCHES);
    return raw ? JSON.parse(raw) : [];
  }

  public getGenerationBatch(id: string): GenerationBatch | undefined {
    return this.getGenerationBatches().find(b => b.id === id);
  }

  public saveGenerationBatch(batch: GenerationBatch): void {
    const current = this.getGenerationBatches();
    const existingIdx = current.findIndex(b => b.id === batch.id);
    let updated: GenerationBatch[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = batch;
    } else {
      updated = [batch, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(updated));
    this.notify();
  }

  // Media Assets (Phase 5)
  public getMediaAssets(): MediaAsset[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDIA_ASSETS);
    return raw ? JSON.parse(raw) : [];
  }

  public getMediaAsset(id: string): MediaAsset | undefined {
    return this.getMediaAssets().find(m => m.id === id);
  }

  public saveMediaAsset(asset: MediaAsset): void {
    const current = this.getMediaAssets();
    const idx = current.findIndex(m => m.id === asset.id);
    let updated: MediaAsset[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = asset;
    } else {
      updated = [asset, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(updated));
    this.notify();
  }

  public deleteMediaAsset(id: string): void {
    const current = this.getMediaAssets();
    const updated = current.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEDIA_ASSETS, JSON.stringify(updated));
    this.notify();
  }

  // Publish Jobs (Phase 8)
  public getPublishJobs(): PublishJob[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PUBLISH_JOBS);
    return raw ? JSON.parse(raw) : [];
  }

  public getPublishJob(id: string): PublishJob | undefined {
    return this.getPublishJobs().find(j => j.id === id || j.publishJobId === id);
  }

  public savePublishJob(job: PublishJob): void {
    const current = this.getPublishJobs();
    const idx = current.findIndex(j => j.id === job.id || j.publishJobId === job.publishJobId);
    let updated: PublishJob[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = job;
    } else {
      updated = [job, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.PUBLISH_JOBS, JSON.stringify(updated));
    this.notify();
  }

  // Quantity Preference
  public getLastUsedQuantity(): number {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_QUANTITY);
    return raw ? Math.max(1, parseInt(raw, 10)) : 10;
  }

  public setLastUsedQuantity(qty: number): void {
    localStorage.setItem(STORAGE_KEYS.LAST_QUANTITY, qty.toString());
  }

  // Theme
  public getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
  }

  public setTheme(theme: 'dark' | 'light') {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }
}

export const localDb = new LocalDatabase();
