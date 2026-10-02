import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function testLaunch() {
  const profileDir = path.resolve('.local-browser/profile');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  console.log('Testing launch with persistent profile:', profileDir);
  try {
    const context = await chromium.launchPersistentContext(profileDir, {
      headless: true, // test headless mode first
      executablePath: fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('Persistent context launched!');
    const page = await context.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('Page title:', title);
    await context.close();
    console.log('Context closed cleanly.');
  } catch (err) {
    console.error('Launch test failed:', err);
  }
}

testLaunch();
