import type { BrowserContext, Page } from 'playwright';
import { browserProfileManager } from './BrowserProfileManager';
import { localDb } from '../../../data/local/database';

export interface LocalBrowserStatus {
  isProcessRunning: boolean;
  profilePath: string;
  activePagesCount: number;
  health: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  lastError?: string;
  launchedAt?: string;
}

const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process.versions?.node);

let playwrightChromium: any = null;
async function getChromium() {
  if (!isNode) return null;
  if (!playwrightChromium) {
    try {
      const pw = await import('playwright');
      playwrightChromium = pw.chromium;
    } catch (e) {
      console.warn('Playwright dynamic import warning:', e);
    }
  }
  return playwrightChromium;
}

export class LocalBrowserManager {
  private context: any = null;
  private isLaunching = false;
  private status: LocalBrowserStatus = {
    isProcessRunning: false,
    profilePath: browserProfileManager.getProfilePath(),
    activePagesCount: 0,
    health: 'OFFLINE'
  };

  /**
   * Launch or connect to local persistent browser context
   */
  public async launch(options: { headless?: boolean } = {}): Promise<any> {
    if (this.context) {
      return this.context;
    }

    if (this.isLaunching) {
      await new Promise(r => setTimeout(r, 1000));
      if (this.context) return this.context;
    }

    this.isLaunching = true;
    const paths = browserProfileManager.ensureDirectories();
    const executablePath = browserProfileManager.getExecutablePath();

    localDb.logActivity('automation_triggered', 'Browser Launch Initiated', `Launching persistent browser context from "${paths.profileDir}".`);

    const chromium = await getChromium();
    if (!chromium) {
      this.status = {
        isProcessRunning: false,
        profilePath: paths.profileDir,
        activePagesCount: 0,
        health: 'OFFLINE',
        lastError: 'Playwright is only executable in Node/Electron environment.'
      };
      this.isLaunching = false;
      return null;
    }

    try {
      this.context = await chromium.launchPersistentContext(paths.profileDir, {
        headless: options.headless !== undefined ? options.headless : false,
        executablePath,
        downloadsPath: paths.downloadsDir,
        viewport: { width: 1280, height: 850 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-infobars',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      this.status = {
        isProcessRunning: true,
        profilePath: paths.profileDir,
        activePagesCount: this.context.pages().length,
        health: 'HEALTHY',
        launchedAt: new Date().toISOString()
      };

      this.context.on('close', () => {
        this.context = null;
        this.status.isProcessRunning = false;
        this.status.health = 'OFFLINE';
        localDb.logActivity('automation_triggered', 'Browser Process Closed', 'Local browser process was closed.');
      });

      localDb.logActivity('automation_triggered', 'Browser Connected', `Persistent local browser launched successfully.`);
      return this.context;
    } catch (err: any) {
      this.status = {
        isProcessRunning: false,
        profilePath: paths.profileDir,
        activePagesCount: 0,
        health: 'OFFLINE',
        lastError: err.message
      };
      localDb.logActivity('automation_triggered', 'Browser Launch Failed', `Failed to launch local browser: ${err.message}`);
      throw err;
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Gets or creates a specific page (e.g. for ChatGPT or Instagram)
   */
  public async getOrCreatePage(targetUrlPrefix: string): Promise<any> {
    const context = await this.launch();
    if (!context) return null;
    const pages = context.pages();

    for (const p of pages) {
      const url = p.url();
      if (url.includes(targetUrlPrefix)) {
        this.status.activePagesCount = pages.length;
        return p;
      }
      if (targetUrlPrefix.includes('chatgpt') || targetUrlPrefix.includes('openai')) {
        if (
          url.includes('chatgpt.com') ||
          url.includes('openai.com') ||
          url.includes('auth.openai.com') ||
          url.includes('auth0.openai.com') ||
          url.includes('accounts.google.com') ||
          url.includes('appleid.apple.com') ||
          url.includes('login.live.com')
        ) {
          this.status.activePagesCount = pages.length;
          return p;
        }
      }
    }

    const newPage = await context.newPage();
    this.status.activePagesCount = context.pages().length;
    return newPage;
  }

  /**
   * Close local browser context
   */
  public async close(): Promise<void> {
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {
        // ignore
      }
      this.context = null;
    }
    this.status.isProcessRunning = false;
    this.status.health = 'OFFLINE';
  }

  /**
   * Restart local browser
   */
  public async restart(): Promise<any> {
    await this.close();
    return this.launch();
  }

  /**
   * Check browser health
   */
  public getStatus(): LocalBrowserStatus {
    const isRunning = this.context !== null;
    let pageCount = 0;
    if (this.context) {
      try {
        pageCount = this.context.pages().length;
      } catch (e) {
        // keep context intact
      }
    }
    this.status = {
      isProcessRunning: isRunning,
      profilePath: browserProfileManager.getProfilePath(),
      activePagesCount: pageCount,
      health: isRunning ? 'HEALTHY' : 'OFFLINE'
    };
    return this.status;
  }

  public getContext(): any {
    return this.context;
  }
}

export const localBrowserManager = new LocalBrowserManager();
