import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
    rollupOptions: { input: 'frontend/web.html' }
  },
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify('https://rotationtv-live-ai-clones.rotationtimmy.workers.dev')
  }
});
