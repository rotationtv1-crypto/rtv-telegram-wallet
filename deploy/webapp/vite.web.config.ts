import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Standalone Web App build — separate from Mini App entry
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '..'),
  publicDir: path.resolve(__dirname, '../public'),
  build: {
    outDir: path.resolve(__dirname, '../dist-web'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, '../web.html'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(
      process.env.VITE_API_BASE || 'https://api.rotationtv.network'
    ),
  },
  server: {
    port: 5174,
    host: true,
  },
});
