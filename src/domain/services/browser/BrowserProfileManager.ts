export interface BrowserProfilePaths {
  rootDir: string;
  profileDir: string;
  downloadsDir: string;
  screenshotsDir: string;
  logsDir: string;
}

const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process.versions?.node);

export class BrowserProfileManager {
  private paths: BrowserProfilePaths;

  constructor(customBaseDir?: string) {
    const baseDir = customBaseDir || '.local-browser';
    this.paths = {
      rootDir: baseDir,
      profileDir: `${baseDir}/profile`,
      downloadsDir: `${baseDir}/downloads`,
      screenshotsDir: `${baseDir}/screenshots`,
      logsDir: `${baseDir}/logs`
    };

    if (isNode) {
      this.ensureDirectories();
    }
  }

  public ensureDirectories(): BrowserProfilePaths {
    if (isNode) {
      try {
        const fs = require('fs');
        const path = require('path');
        const baseDir = path.resolve(this.paths.rootDir);
        const resolvedPaths = {
          rootDir: baseDir,
          profileDir: path.join(baseDir, 'profile'),
          downloadsDir: path.join(baseDir, 'downloads'),
          screenshotsDir: path.join(baseDir, 'screenshots'),
          logsDir: path.join(baseDir, 'logs')
        };
        Object.values(resolvedPaths).forEach(dirPath => {
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
        });
        this.paths = resolvedPaths;
      } catch (e) {
        // Safe fallback in non-node environment
      }
    }
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
    if (!isNode) return undefined;
    try {
      const fs = require('fs');
      const chromeMac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (fs.existsSync(chromeMac)) {
        return chromeMac;
      }
    } catch (e) {}

    // Fallback macOS system Chrome path if fs check is bypassed in bundled runtime
    if (typeof process !== 'undefined' && process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    return undefined;
  }
}

export const browserProfileManager = new BrowserProfileManager();
