import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/workout-tracker/',
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  plugins: [
    react(),
    VitePWA({
      filename: 'sw.ts',
      includeAssets: ['favicon.svg'],
      manifest: {
        background_color: '#1a202c',
        description:
          'Log your workouts. Stored locally in your browser via OPFS + SQLite.',
        display: 'standalone',
        icons: [
          {
            sizes: '192x192',
            src: 'icon-192.png',
            type: 'image/png',
          },
          {
            sizes: '512x512',
            src: 'icon-512.png',
            type: 'image/png',
          },
          {
            purpose: 'maskable',
            sizes: '512x512',
            src: 'icon-512-maskable.png',
            type: 'image/png',
          },
          {
            sizes: 'any',
            src: 'favicon.svg',
            type: 'image/svg+xml',
          },
        ],
        name: 'Workout Log',
        orientation: 'portrait',
        scope: '/workout-tracker/',
        short_name: 'Workout',
        start_url: '/workout-tracker/',
        theme_color: '#1a202c',
      },
      registerType: 'autoUpdate',
      srcDir: 'src',
      strategies: 'injectManifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}'],
        maximumFileSizeToCacheInBytes: 10 * 1_024 * 1_024,
      },
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});
