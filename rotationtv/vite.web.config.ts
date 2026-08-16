import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-web',
    rollupOptions: {
      input: 'src/pages/WebApp.tsx',
    },
  },
  server: { port: 3001 },
});
