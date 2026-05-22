# Contract: New exports added to `src/database.ts`

Two new typed async helpers. Both respect Constitution Principle II (all DB access goes through `database.ts`; UI components never touch the promiser directly).

---

## `exportDatabaseBytes()`

```ts
export const exportDatabaseBytes = async (): Promise<Uint8Array>;
```

**Behavior**:

1. Calls `await initDatabase()` to obtain the memoized promiser. Does NOT spawn a second worker.
2. Issues `promiser('export', { dbId: requireDatabaseId() })`.
3. Returns `result.byteArray` (or normalizes from `ArrayBuffer` to `Uint8Array` if the build returns the latter).

**Pre-conditions**: `initDatabase()` is callable in the current page (`crossOriginIsolated`-capable, worker bootable).

**Post-conditions**: No mutation to the in-OPFS database. No locks held after the call returns.

**Errors**:
- Any error from the promiser propagates as-is. Caller is responsible for surfacing to the user.

**Used by**: `WorkoutDataActions` container's Export button handler.

---

## `replaceDatabaseAndReload(bytes: Uint8Array): Promise<never>`

```ts
export const replaceDatabaseAndReload = async (bytes: Uint8Array): Promise<never>;
```

**Behavior** (in this strict order):

1. `await initDatabase()` (idempotent; ensures `databaseId` is set even if called before any prior DB use).
2. Verify magic header on the supplied bytes: `bytes.slice(0, 16)` decodes to `"SQLite format 3 "` (latin1). On mismatch → throw `Error('Selected file is not a SQLite database.')`. No OPFS mutation occurs.
3. Close the worker's DB: `promiser('close', { dbId: requireDatabaseId() })`. Wrapped in `try/catch` — a failure here is logged but does not abort, because the worker may already be in an unusable state and the reload will reset it regardless.
4. Open the OPFS root: `const root = await navigator.storage.getDirectory()`. If `navigator.storage` is unavailable (OPFS fallback case), skip steps 5–6 and proceed directly to reload — the in-memory DB has no file to swap, so import has no persistent effect; the UI must already warn the user of this before calling.
5. Best-effort remove the old file and its sidecars: for each of `app.sqlite3`, `app.sqlite3-journal`, `app.sqlite3-wal`, `app.sqlite3-shm`, call `root.removeEntry(name).catch(() => undefined)` (sidecars commonly don't exist).
6. Write the new file: `getFileHandle('app.sqlite3', { create: true })` → `createWritable()` → `write(bytes)` → `close()`. If this throws AFTER step 5, the caller has been warned in the confirm prompt that an error here leaves the app in a fresh-DB state on next load. The thrown error MUST propagate so the UI can surface it before any reload — `replaceDatabaseAndReload` must NOT call `location.reload()` on failure.
7. `location.reload()`. The promise never resolves (return type `Promise<never>`).

**Pre-conditions**:
- The caller has already obtained explicit user confirmation that the existing database will be wiped.
- The caller has already performed the user-facing magic-header check too, OR is relying on this helper to do it before any destructive step (step 2 above guarantees that).

**Post-conditions on success**: Page reloads; no JS state from the previous session survives.

**Post-conditions on failure**:
- If step 2 fails → existing OPFS file untouched. UI shows error.
- If step 6 fails → the OPFS file may have been removed (step 5 succeeded but step 6 didn't). UI must show a fatal error message instructing the user to retry or load a different backup. Per FR-014, no silent reload.

**Errors**:
- `Error('Selected file is not a SQLite database.')` — header mismatch (recoverable, no data loss).
- Any OPFS API error during write — fatal for this session; the existing DB is gone but the new one didn't land.

**Used by**: `WorkoutDataActions` container's Import button confirmation handler.

---

## Test note

Per Constitution Principle V, no automated tests are added. Validation is via [quickstart.md](../quickstart.md).
