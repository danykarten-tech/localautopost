import { localBrowserManager } from './LocalBrowserManager';
import { chatGPTBrowserConnector, ChatGPTConnectorState } from './ChatGPTBrowserConnector';
import { instagramBrowserConnector, InstagramConnectorState } from './InstagramBrowserConnector';
import { localDb } from '../../../data/local/database';

export interface SessionMonitorSummary {
  browserRunning: boolean;
  chatgptState: ChatGPTConnectorState;
  instagramState: InstagramConnectorState;
  lastMonitoredAt: string;
}

export class SessionMonitor {
  private monitorInterval: any = null;
  private isMonitoring = false;

  public startMonitoring(intervalMs = 5000): void {
    if (this.monitorInterval) return;

    this.monitorInterval = setInterval(async () => {
      await this.tickMonitor();
    }, intervalMs);
  }

  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  public async tickMonitor(): Promise<SessionMonitorSummary> {
    if (this.isMonitoring) return this.getSummary();
    this.isMonitoring = true;

    try {
      const browserStatus = localBrowserManager.getStatus();

      if (browserStatus.isProcessRunning) {
        await chatGPTBrowserConnector.checkSession().catch(() => {});
        await instagramBrowserConnector.checkSession().catch(() => {});
      } else {
        chatGPTBrowserConnector.getState().status = 'CHATGPT_OFFLINE';
        instagramBrowserConnector.getState().status = 'INSTAGRAM_OFFLINE';
      }

      return this.getSummary();
    } finally {
      this.isMonitoring = false;
    }
  }

  public getSummary(): SessionMonitorSummary {
    return {
      browserRunning: localBrowserManager.getStatus().isProcessRunning,
      chatgptState: chatGPTBrowserConnector.getState(),
      instagramState: instagramBrowserConnector.getState(),
      lastMonitoredAt: new Date().toISOString()
    };
  }
}

export const sessionMonitor = new SessionMonitor();
