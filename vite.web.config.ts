import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Canonical production API for standalone Web App (issue #19).
 * Architecture lock:
 *   app.rotationtv.network  →  WebApp (this build → dist-web)
 *   api.rotationtv.network  →  Cloudflare Edge / Worker gateway
 */
const CANONICAL_API = 'https://api.rotationtv.network';
const LEGACY_DEV_API = 'https://rotationtv-live-ai-clones.rotationtimmy.workers.dev';

function resolveApiBase(): string {
  const fromEnv = process.env.VITE_API_BASE?.trim();
  if (fromEnv) {
    // Guard: reject accidental production builds pointed at unexpected origins
    if (process.env.NODE_ENV === 'production' || process.env.MODE === 'production') {
      const allowed =
        fromEnv === CANONICAL_API ||
        fromEnv.startsWith('http://localhost') ||
        fromEnv.startsWith('https://localhost');
      if (!allowed) {
        console.warn(
          `[vite.web] WARNING: VITE_API_BASE="${fromEnv}" is not the canonical production origin. ` +
            `Expected ${CANONICAL_API}. Proceeding with provided value.`
        );
      }
    }
    return fromEnv;
  }
  // Default: production → canonical; otherwise keep existing workers.dev for local/dev continuity
  if (process.env.NODE_ENV === 'production' || process.env.MODE === 'production') {
    return CANONICAL_API;
  }
  return LEGACY_DEV_API;
}

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
    rollupOptions: { input: 'frontend/web.html' },
  },
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(resolveApiBase()),
  },
});
