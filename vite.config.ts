import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/workout-tracker/',
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      filename: 'sw.ts',
      includeAssets: ['favicon.svg'],
      // injectManifest is the option key honored for `strategies: 'injectManifest'`.
      // jpg is deliberately NOT precached: the ~11 MB of exercise images would
      // sit in Cache Storage, which shares the per-origin storage quota with
      // OPFS. On storage-constrained phones that pressure evicted the imported
      // SQLite DB (best-effort, non-persisted storage), breaking import. Images
      // load over the network instead; add runtime caching later if offline
      // images are needed — that does not bloat the install/precache.
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}'],
        maximumFileSizeToCacheInBytes: 10 * 1_024 * 1_024,
      },
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
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});
