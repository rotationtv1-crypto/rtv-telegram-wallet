import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Mini App / primary Vite config.
 * Shares the same API origin resolution as the standalone Web App (issue #19).
 */
const CANONICAL_API = 'https://api.rotationtv.network';
const LEGACY_DEV_API = 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

function resolveApiBase(): string {
  const fromEnv = process.env.VITE_API_BASE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production' || process.env.MODE === 'production') {
    return CANONICAL_API;
  }
  return LEGACY_DEV_API;
}

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(resolveApiBase()),
  },
});
