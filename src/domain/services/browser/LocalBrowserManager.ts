import { chromium, BrowserContext, Page } from 'playwright';
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

export class LocalBrowserManager {
  private context: BrowserContext | null = null;
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
  public async launch(options: { headless?: boolean } = {}): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    if (this.isLaunching) {
      // Wait for launch to finish
      await new Promise(r => setTimeout(r, 1000));
      if (this.context) return this.context;
    }

    this.isLaunching = true;
    const paths = browserProfileManager.ensureDirectories();
    const executablePath = browserProfileManager.getExecutablePath();

    localDb.logActivity('automation_triggered', 'Browser Launch Initiated', `Launching persistent browser context from "${paths.profileDir}".`);

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
  public async getOrCreatePage(targetUrlPrefix: string): Promise<Page> {
    const context = await this.launch();
    const pages = context.pages();

    for (const p of pages) {
      if (p.url().includes(targetUrlPrefix)) {
        this.status.activePagesCount = context.pages().length;
        return p;
      }
    }

    // Create new page if not found
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
  public async restart(): Promise<BrowserContext> {
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

  public getContext(): BrowserContext | null {
    return this.context;
  }
}

export const localBrowserManager = new LocalBrowserManager();
