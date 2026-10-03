import type { Page } from 'playwright';
import { localBrowserManager } from './LocalBrowserManager';
import { browserProfileManager } from './BrowserProfileManager';

export interface ActionResult<T = any> {
  success: boolean;
  state: 'started' | 'completed' | 'failed' | 'action_required';
  data?: T;
  error?: string;
  screenshotPath?: string;
  durationMs?: number;
}

const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process.versions?.node);

export class BrowserActionExecutor {
  /**
   * Opens URL in browser target page
   */
  public async openUrl(targetUrl: string): Promise<ActionResult<string>> {
    const startTime = Date.now();
    const domain = new URL(targetUrl).hostname;
    const page = await localBrowserManager.getOrCreatePage(domain);

    this.logAction('openUrl', `Opening URL "${targetUrl}"`);

    if (!page) {
      return {
        success: false,
        state: 'failed',
        error: 'Browser page context unavailable.',
        durationMs: Date.now() - startTime
      };
    }

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const currentUrl = page.url();
      return {
        success: true,
        state: 'completed',
        data: currentUrl,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      const ssPath = await this.takeScreenshot(page, `err_openUrl_${Date.now()}.png`);
      return {
        success: false,
        state: 'failed',
        error: err.message,
        screenshotPath: ssPath,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Waits for specific DOM selector on page
   */
  public async waitForPage(page: Page, selector: string, timeoutMs = 15000): Promise<ActionResult<boolean>> {
    const startTime = Date.now();
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: timeoutMs });
      return {
        success: true,
        state: 'completed',
        data: true,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      const ssPath = await this.takeScreenshot(page, `err_waitFor_${Date.now()}.png`);
      return {
        success: false,
        state: 'action_required',
        error: `Element "${selector}" not found on page. ${err.message}`,
        screenshotPath: ssPath,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Clicks a target DOM selector
   */
  public async click(page: Page, selector: string): Promise<ActionResult<boolean>> {
    const startTime = Date.now();
    try {
      await page.click(selector, { timeout: 10000 });
      return {
        success: true,
        state: 'completed',
        data: true,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        success: false,
        state: 'failed',
        error: err.message,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Types text into input selector
   */
  public async typeText(page: Page, selector: string, text: string): Promise<ActionResult<boolean>> {
    const startTime = Date.now();
    try {
      await page.fill(selector, text, { timeout: 10000 });
      return {
        success: true,
        state: 'completed',
        data: true,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        success: false,
        state: 'failed',
        error: err.message,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Uploads local file asset to file input element
   */
  public async uploadFile(page: Page, inputSelector: string, filePath: string): Promise<ActionResult<boolean>> {
    const startTime = Date.now();
    if (isNode) {
      try {
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
          return {
            success: false,
            state: 'failed',
            error: `File path does not exist: "${filePath}"`
          };
        }
      } catch (e) {}
    }

    try {
      await page.setInputFiles(inputSelector, filePath, { timeout: 15000 });
      return {
        success: true,
        state: 'completed',
        data: true,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        success: false,
        state: 'failed',
        error: err.message,
        durationMs: Date.now() - startTime
      };
    }
  }

  /**
   * Takes a screenshot of current page
   */
  public async takeScreenshot(page: Page, filename: string): Promise<string> {
    const ssDir = browserProfileManager.getScreenshotsPath();
    let targetPath = `${ssDir}/${filename}`;
    if (isNode) {
      try {
        const path = require('path');
        targetPath = path.join(ssDir, filename);
      } catch (e) {}
    }
    try {
      if (page && typeof page.screenshot === 'function') {
        await page.screenshot({ path: targetPath, fullPage: false }).catch(() => {});
      }
      return targetPath;
    } catch (e) {
      return targetPath;
    }
  }

  private logAction(action: string, msg: string) {
    if (isNode) {
      try {
        const fs = require('fs');
        const path = require('path');
        const logsDir = browserProfileManager.getLogsPath();
        const logFile = path.join(logsDir, 'automation.log');
        const line = `[${new Date().toISOString()}] [${action}] ${msg}\n`;
        fs.appendFileSync(logFile, line, { encoding: 'utf-8' });
      } catch (e) {}
    }
  }
}

export const browserActionExecutor = new BrowserActionExecutor();
