import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'playwright': path.resolve(__dirname, './src/domain/services/browser/playwrightStub.ts'),
    },
  },
  server: {
    port: 3000,
    open: false,
  }
});
