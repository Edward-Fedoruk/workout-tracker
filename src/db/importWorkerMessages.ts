// Message protocol shared between the main thread (importDatabaseFile.ts) and
// the OPFS write worker (importWorker.ts).
//
// These types live in their own runtime-free module so that nothing imports
// `importWorker.ts` as a module — it is referenced only as a `new Worker(...)`
// target. That keeps it a pure worker entry: its top-level
// `self.addEventListener('message')` must never end up on the main thread,
// where `self` is `window` and the listener would fire on every window message
// and re-post to itself, spinning the CPU. (The other half of that guarantee is
// the load-bearing `./` prefix on the worker URL in importDatabaseFile.ts.)

export type ImportRequest = {
  bytes: Uint8Array;
  filename: string;
  sidecars: string[];
};

export type ImportResponse = { error: string; ok: false } | { ok: true };
