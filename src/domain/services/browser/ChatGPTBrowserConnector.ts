import { Page } from 'playwright';
import { localBrowserManager } from './LocalBrowserManager';
import { localDb } from '../../../data/local/database';

export type ChatGPTConnectionStatus =
  | 'CHATGPT_OFFLINE'
  | 'CHATGPT_BROWSER_OPEN'
  | 'CHATGPT_LOGIN_REQUIRED'
  | 'CHATGPT_AUTHENTICATING'
  | 'CHATGPT_READY'
  | 'CHATGPT_SESSION_EXPIRED'
  | 'CHATGPT_ACTION_REQUIRED'
  | 'CHATGPT_ERROR';

export interface ChatGPTConnectorState {
  status: ChatGPTConnectionStatus;
  currentUrl?: string;
  isReady: boolean;
  requiresManualLogin: boolean;
  lastCheckedAt?: string;
  errorMessage?: string;
}

export class ChatGPTBrowserConnector {
  private state: ChatGPTConnectorState = {
    status: 'CHATGPT_OFFLINE',
    currentUrl: 'https://chatgpt.com',
    isReady: false,
    requiresManualLogin: false
  };

  public getState(): ChatGPTConnectorState {
    return this.state;
  }

  /**
   * Opens or navigates to ChatGPT and checks real DOM session state
   */
  public async checkSession(): Promise<ChatGPTConnectorState> {
    this.state.currentUrl = 'https://chatgpt.com';
    this.state.lastCheckedAt = new Date().toISOString();

    try {
      const page = await localBrowserManager.getOrCreatePage('chatgpt.com');
      this.state.status = 'CHATGPT_BROWSER_OPEN';

      if (!page.url().includes('chatgpt.com') && !page.url().includes('chat.openai.com')) {
        await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
      }

      const currentUrl = page.url();
      this.state.currentUrl = (!currentUrl || currentUrl === 'about:blank') ? 'https://chatgpt.com' : currentUrl;
      const url = page.url();

      // 1. Check for Login page
      if (url.includes('/auth/login') || url.includes('/login')) {
        this.state.status = 'CHATGPT_LOGIN_REQUIRED';
        this.state.isReady = false;
        this.state.requiresManualLogin = true;
        this.updateDbStatus(false, 'Login Required');
        return this.state;
      }

      // 2. Check for Cloudflare / Security Challenge
      const content = await page.content().catch(() => '');
      if (content.includes('cf-challenge') || content.includes('Just a moment...') || content.includes('Verify you are human')) {
        this.state.status = 'CHATGPT_ACTION_REQUIRED';
        this.state.isReady = false;
        this.state.errorMessage = 'Cloudflare / Security Challenge detected. Manual human verification required.';
        this.updateDbStatus(false, 'Action Required');
        return this.state;
      }

      // 3. Check for Logged-In Composer Element
      const composerSelectors = ['#prompt-textarea', 'textarea[tabindex="0"]', 'textarea[placeholder*="Message"]', 'textarea'];
      let foundComposer = false;
      for (const sel of composerSelectors) {
        if (await page.isVisible(sel).catch(() => false)) {
          foundComposer = true;
          break;
        }
      }

      const hasLoginButton = await page.isVisible('button[data-testid="login-button"]').catch(() => false) ||
                             await page.isVisible('a[href*="/auth/login"]').catch(() => false);

      if (hasLoginButton) {
        this.state.status = 'CHATGPT_LOGIN_REQUIRED';
        this.state.isReady = false;
        this.state.requiresManualLogin = true;
        this.updateDbStatus(false, 'Login Required');
        return this.state;
      }

      if (foundComposer) {
        this.state.status = 'CHATGPT_READY';
        this.state.isReady = true;
        this.state.requiresManualLogin = false;
        this.updateDbStatus(true, 'Ready');
        return this.state;
      }

      this.state.status = 'CHATGPT_LOGIN_REQUIRED';
      this.state.isReady = false;
      this.state.requiresManualLogin = true;
      this.updateDbStatus(false, 'Login Required');
      return this.state;

    } catch (err: any) {
      this.state.status = 'CHATGPT_LOGIN_REQUIRED';
      this.state.currentUrl = 'https://chatgpt.com';
      this.state.isReady = false;
      this.state.requiresManualLogin = true;
      this.state.errorMessage = err.message;
      this.updateDbStatus(false, 'Login Required');
      return this.state;
    }
  }

  /**
   * Opens ChatGPT in headful browser window to allow manual user login
   */
  public async openManualLogin(): Promise<void> {
    localDb.logActivity('account_connected', 'Manual Login Initiated', 'Opened ChatGPT in browser window for manual user authentication.');
    const page = await localBrowserManager.getOrCreatePage('chatgpt.com');
    await page.goto('https://chatgpt.com/auth/login', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.checkSession();
  }

  private updateDbStatus(isReady: boolean, statusLabel: string) {
    const aiConn = localDb.getAIConnection();
    aiConn.browserStatus = 'Detected';
    aiConn.chatgptSession = isReady ? 'Ready' : 'Not Ready';
    aiConn.isSessionActive = isReady;
    aiConn.status = isReady ? 'connected' : 'needs_attention';
    aiConn.sessionState = isReady ? 'SESSION_READY' : 'CHATGPT_OPEN';
    localDb.saveAIConnection(aiConn);
  }
}

export const chatGPTBrowserConnector = new ChatGPTBrowserConnector();
