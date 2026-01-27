/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            open: false
          })
        ]
      : [])
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  server: {
    port: 3000,
    open: true,
    host: (() => {
      const devHost = process.env.VITE_DEV_HOST;
      if (!devHost) return false;
      if (devHost === 'true') return true;
      if (devHost === 'false') return false;
      return devHost;
    })(),
    proxy: {
      '/api': 'http://localhost:8787'
    }
  }
});
