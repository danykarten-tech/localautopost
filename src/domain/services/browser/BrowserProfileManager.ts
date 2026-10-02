import path from 'path';
import fs from 'fs';

export interface BrowserProfilePaths {
  rootDir: string;
  profileDir: string;
  downloadsDir: string;
  screenshotsDir: string;
  logsDir: string;
}

export class BrowserProfileManager {
  private paths: BrowserProfilePaths;

  constructor(customBaseDir?: string) {
    const baseDir = customBaseDir || path.resolve('.local-browser');
    this.paths = {
      rootDir: baseDir,
      profileDir: path.join(baseDir, 'profile'),
      downloadsDir: path.join(baseDir, 'downloads'),
      screenshotsDir: path.join(baseDir, 'screenshots'),
      logsDir: path.join(baseDir, 'logs')
    };

    this.ensureDirectories();
  }

  public ensureDirectories(): BrowserProfilePaths {
    Object.values(this.paths).forEach(dirPath => {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    return this.paths;
  }

  public getPaths(): BrowserProfilePaths {
    return this.paths;
  }

  public getProfilePath(): string {
    return this.paths.profileDir;
  }

  public getDownloadsPath(): string {
    return this.paths.downloadsDir;
  }

  public getScreenshotsPath(): string {
    return this.paths.screenshotsDir;
  }

  public getLogsPath(): string {
    return this.paths.logsDir;
  }

  public getExecutablePath(): string | undefined {
    const chromeMac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(chromeMac)) return chromeMac;
    return undefined;
  }
}

export const browserProfileManager = new BrowserProfileManager();
