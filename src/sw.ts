import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let worker: ServiceWorkerGlobalScope;

// Inject COOP/COEP headers on every response so the page is cross-origin
// isolated on GitHub Pages (which cannot set these headers server-side).
worker.addEventListener('fetch', (event) => {
  event.respondWith(
    // eslint-disable-next-line promise/prefer-await-to-then
    fetch(event.request).then((response) => {
      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      return new Response(response.body, {
        headers,
        status: response.status,
        statusText: response.statusText,
      });
    }),
  );
});

cleanupOutdatedCaches();
precacheAndRoute(worker.__WB_MANIFEST);
