import {
  type ImportRequest,
  type ImportResponse,
} from './importWorkerMessages';

const DATABASE_FILENAME = 'app.sqlite3';
const SIDECARS = ['app.sqlite3-journal', 'app.sqlite3-wal', 'app.sqlite3-shm'];

// Writes the imported database bytes into OPFS via a dedicated worker.
//
// The worker is the only place this can happen on iOS Safari, where OPFS writes
// require `createSyncAccessHandle` (worker-only) rather than `createWritable`.
export const writeDatabaseFile = (bytes: Uint8Array): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    // The `./` prefix is required: Vite only externalizes the worker into its
    // own chunk when the URL is an explicit relative literal. Without it, Vite
    // inlines importWorker.ts into the main bundle, where its top-level
    // `self.addEventListener('message')` runs on `window` and spins the CPU.
    // eslint-disable-next-line unicorn/relative-url-style -- the leading ./ is load-bearing for Vite's worker bundling; see comment above
    const worker = new Worker(new URL('./importWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.addEventListener(
      'message',
      (event: MessageEvent<ImportResponse>) => {
        worker.terminate();
        if (event.data.ok) {
          resolve();
        } else {
          reject(new Error(event.data.error));
        }
      },
    );

    worker.addEventListener('error', (event) => {
      worker.terminate();
      reject(new Error(event.message || 'Failed to write database.'));
    });

    const request: ImportRequest = {
      bytes,
      filename: DATABASE_FILENAME,
      sidecars: SIDECARS,
    };

    // Transfer the buffer to avoid copying the whole file across the boundary.
    worker.postMessage(request, [bytes.buffer]);
  });
};
