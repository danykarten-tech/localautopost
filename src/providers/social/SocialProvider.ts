import { SocialAccount } from '../../domain/models/types';

export interface SocialProvider {
  id: string;
  platformName: string;
  getAccountInfo(): Promise<SocialAccount>;
  connectAccount(): Promise<SocialAccount>;
  disconnectAccount(): Promise<boolean>;
  schedulePostLocally(contentId: string, scheduledTime: string): Promise<boolean>;
}

export class InstagramLocalProvider implements SocialProvider {
  id = 'instagram_local';
  platformName = 'Instagram';

  private connectedAccount: SocialAccount = {
    id: 'soc_insta_1',
    platform: 'instagram',
    platformName: 'Instagram',
    handle: '@northstarcoffee',
    status: 'connected',
    accountType: 'Business',
    followerCount: '14.2k',
    connectedAt: new Date().toISOString(),
    isAvailableInPhase1: true
  };

  async getAccountInfo(): Promise<SocialAccount> {
    return this.connectedAccount;
  }

  async connectAccount(): Promise<SocialAccount> {
    this.connectedAccount.status = 'connected';
    return this.connectedAccount;
  }

  async disconnectAccount(): Promise<boolean> {
    this.connectedAccount.status = 'not_connected';
    return true;
  }

  async schedulePostLocally(_contentId: string, _scheduledTime: string): Promise<boolean> {
    // Local queueing logic
    return true;
  }
}
