export const chromium = {
  launchPersistentContext: async () => {
    throw new Error('Playwright is available in Node/Electron background automation environment.');
  }
};
export type BrowserContext = any;
export type Page = any;
export default { chromium };
