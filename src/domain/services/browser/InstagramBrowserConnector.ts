import { Page } from 'playwright';
import { localBrowserManager } from './LocalBrowserManager';
import { localDb } from '../../../data/local/database';

export type InstagramConnectionStatus =
  | 'INSTAGRAM_OFFLINE'
  | 'INSTAGRAM_BROWSER_OPEN'
  | 'INSTAGRAM_LOGIN_REQUIRED'
  | 'INSTAGRAM_AUTHENTICATING'
  | 'INSTAGRAM_READY'
  | 'INSTAGRAM_SESSION_EXPIRED'
  | 'INSTAGRAM_ACTION_REQUIRED'
  | 'INSTAGRAM_ERROR';

export interface InstagramConnectorState {
  status: InstagramConnectionStatus;
  currentUrl?: string;
  isReady: boolean;
  requiresManualLogin: boolean;
  detectedAccount?: string;
  lastCheckedAt?: string;
  errorMessage?: string;
}

export class InstagramBrowserConnector {
  private state: InstagramConnectorState = {
    status: 'INSTAGRAM_OFFLINE',
    currentUrl: 'https://www.instagram.com',
    isReady: false,
    requiresManualLogin: false
  };

  public getState(): InstagramConnectorState {
    return this.state;
  }

  /**
   * Opens or navigates to Instagram and checks real DOM session state
   */
  public async checkSession(): Promise<InstagramConnectorState> {
    this.state.currentUrl = 'https://www.instagram.com';
    this.state.lastCheckedAt = new Date().toISOString();

    try {
      const page = await localBrowserManager.getOrCreatePage('instagram.com');
      this.state.status = 'INSTAGRAM_BROWSER_OPEN';

      if (!page.url().includes('instagram.com')) {
        await page.goto('https://www.instagram.com', { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
      }

      const currentUrl = page.url();
      this.state.currentUrl = (!currentUrl || currentUrl === 'about:blank') ? 'https://www.instagram.com' : currentUrl;
      const url = page.url();

      // 1. Check for Login page or form
      const isLoginPage = url.includes('/accounts/login') || url.includes('/login');
      const hasLoginForm = await page.isVisible('input[name="username"]').catch(() => false);

      if (isLoginPage || hasLoginForm) {
        this.state.status = 'INSTAGRAM_LOGIN_REQUIRED';
        this.state.isReady = false;
        this.state.requiresManualLogin = true;
        this.updateSocialStatus(false);
        return this.state;
      }

      // 2. Check for Security Challenge / Suspicious Activity / CAPTCHA
      const content = await page.content().catch(() => '');
      if (content.includes('challenge') || content.includes('Suspicious Activity') || content.includes('Confirm it’s You') || content.includes('Help Us Verify')) {
        this.state.status = 'INSTAGRAM_ACTION_REQUIRED';
        this.state.isReady = false;
        this.state.errorMessage = 'Instagram Security Challenge / Verification required.';
        this.updateSocialStatus(false);
        return this.state;
      }

      // 3. Check for Logged-In Navigation Elements
      const navSelectors = [
        'svg[aria-label="New post"]',
        'svg[aria-label="Home"]',
        'svg[aria-label="Instagram"]',
        'a[href*="/direct/"]',
        'a[href*="/explore/"]',
        'span:has-text("Create")'
      ];

      let foundNav = false;
      for (const sel of navSelectors) {
        if (await page.isVisible(sel).catch(() => false)) {
          foundNav = true;
          break;
        }
      }

      if (foundNav && !url.includes('login')) {
        this.state.status = 'INSTAGRAM_READY';
        this.state.isReady = true;
        this.state.requiresManualLogin = false;
        this.updateSocialStatus(true);
        return this.state;
      }

      this.state.status = 'INSTAGRAM_LOGIN_REQUIRED';
      this.state.isReady = false;
      this.state.requiresManualLogin = true;
      this.updateSocialStatus(false);
      return this.state;

    } catch (err: any) {
      this.state.status = 'INSTAGRAM_LOGIN_REQUIRED';
      this.state.currentUrl = 'https://www.instagram.com';
      this.state.isReady = false;
      this.state.requiresManualLogin = true;
      this.state.errorMessage = err.message;
      this.updateSocialStatus(false);
      return this.state;
    }
  }

  /**
   * Opens Instagram in browser window to allow manual user login
   */
  public async openManualLogin(): Promise<void> {
    localDb.logActivity('account_connected', 'Instagram Login Initiated', 'Opened Instagram in browser window for manual user login.');
    const page = await localBrowserManager.getOrCreatePage('instagram.com');
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.checkSession();
  }

  private updateSocialStatus(isConnected: boolean) {
    const accounts = localDb.getSocialAccounts();
    const insta = accounts.find(a => a.platform === 'instagram');
    if (insta) {
      insta.status = isConnected ? 'connected' : 'needs_attention';
      localDb.saveSocialAccounts(accounts);
    }
  }
}

export const instagramBrowserConnector = new InstagramBrowserConnector();
