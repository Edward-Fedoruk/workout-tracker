import { type ImportRequest, type ImportResponse } from './importWorker';

const DATABASE_FILENAME = 'app.sqlite3';
const SIDECARS = ['app.sqlite3-journal', 'app.sqlite3-wal', 'app.sqlite3-shm'];

// Writes the imported database bytes into OPFS via a dedicated worker.
//
// The worker is the only place this can happen on iOS Safari, where OPFS writes
// require `createSyncAccessHandle` (worker-only) rather than `createWritable`.
export const writeDatabaseFile = (bytes: Uint8Array): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const worker = new Worker(new URL('importWorker.ts', import.meta.url), {
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
