// Dedicated worker that writes an imported SQLite file into OPFS.
//
// The main thread cannot do this on iOS Safari: `FileSystemFileHandle.createWritable`
// is unavailable there, and OPFS writes are only possible from a worker via
// `createSyncAccessHandle`. This worker is the iOS-compatible write path.

// eslint-disable-next-line consistent-this
declare let self: DedicatedWorkerGlobalScope;

export type ImportRequest = {
  bytes: Uint8Array;
  filename: string;
  sidecars: string[];
};

export type ImportResponse = { error: string; ok: false } | { ok: true };

// The sqlite worker may not have released its OPFS sync-access handle the instant
// `promiser('close')` resolves. Retry briefly before giving up.
const createAccessHandleWithRetry = async (
  fileHandle: FileSystemFileHandle,
): Promise<FileSystemSyncAccessHandle> => {
  const maxAttempts = 10;
  const delayMs = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fileHandle.createSyncAccessHandle();
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  // Unreachable: the loop either returns a handle or throws on the last attempt.
  throw new Error('Could not acquire an OPFS sync access handle.');
};

const writeFile = async (request: ImportRequest): Promise<void> => {
  const root = await navigator.storage.getDirectory();

  // Remove the previous database and its sidecars first (FR-013: no residual
  // state from the prior database may survive). Sidecars commonly don't exist.
  for (const name of [request.filename, ...request.sidecars]) {
    await root.removeEntry(name).catch(() => undefined);
  }

  const fileHandle = await root.getFileHandle(request.filename, {
    create: true,
  });

  const accessHandle = await createAccessHandleWithRetry(fileHandle);
  try {
    accessHandle.truncate(0);
    accessHandle.write(request.bytes, { at: 0 });
    accessHandle.flush();
  } finally {
    accessHandle.close();
  }
};

self.addEventListener('message', (event: MessageEvent<ImportRequest>) => {
  void (async () => {
    try {
      await writeFile(event.data);
      const response: ImportResponse = { ok: true };
      // eslint-disable-next-line unicorn/require-post-message-target-origin -- worker scope, not Window
      self.postMessage(response);
    } catch (error) {
      const response: ImportResponse = {
        error:
          error instanceof Error ? error.message : 'Failed to write database.',
        ok: false,
      };
      // eslint-disable-next-line unicorn/require-post-message-target-origin -- worker scope, not Window
      self.postMessage(response);
    }
  })();
});
