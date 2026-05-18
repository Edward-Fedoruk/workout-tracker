# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Local-first workout logging PWA. All data lives in the browser — SQLite-WASM persisted to OPFS, with an in-memory fallback when OPFS is unavailable. No backend.

## Commands

- `npm run dev` — Vite dev server. The service worker is **not** registered in dev; use `preview` to test PWA install/offline.
- `npm run build` — `tsc -b` then `vite build`. Emits the service worker and manifest.
- `npm run preview` — serve the production build (required to exercise the PWA).
- `npm run lint` — ESLint over the repo.

There is no test runner configured.

## Architecture invariants

These are hard rules. Breaking them silently corrupts data, breaks OPFS, or causes the worker to be instantiated twice.

- **The worker is created exactly once.** `sqlite3Worker1Promiser` is called inside `initDatabase` in `src/database.ts`, and `initDatabase` is memoized by the module-level `dbPromise`. Never call `sqlite3Worker1Promiser` from anywhere else. Never bypass the memoization (e.g. by adding a guard that re-creates it).
- **`dbId` is set once at init and used by every `exec` call.** It lives at module scope in `database.ts`. Every helper must pass it. Do not call `promiser('open', ...)` from outside `initDatabase`.
- **All DB access goes through `database.ts`.** UI/components never import `@sqlite.org/sqlite-wasm` directly and never see the raw `promiser`. To expose a new operation, add a typed async helper to `database.ts` and import it.
- **All schema work happens inside `initDatabase` before it resolves.** Both `CREATE TABLE` and any migrations must complete before the promise returned by `initDatabase` resolves. The rest of the app assumes a fully-migrated DB.
- **UI gates on `isDbReady`.** `App.tsx` does not render the main tree until `initDatabase()` resolves. New top-level UI must respect that gate or be mounted inside it.
- **Never string-interpolate SQL.** Always use the `bind` array with `?` placeholders. The promiser supports only positional params.

## SQLite-WASM promiser contract

The promiser is the only handle to the worker. Its shape (as used in this repo):

```ts
type Promiser = (command: 'open' | 'exec' | string, params: object) => Promise<any>
```

### `promiser('open', { filename })`

- `filename: 'file:<name>.sqlite3?vfs=opfs'` — opens a persistent OPFS-backed DB.
- `filename: ':memory:'` — opens a non-persistent in-memory DB (the fallback path).
- Returns `{ result: { dbId, filename, ... } }`. Capture `dbId` at module scope.
- Throws if OPFS is unavailable (the catch in `initDatabase` falls back to in-memory).

### `promiser('exec', { sql, bind?, rowMode?, dbId })`

- `sql: string` — single statement; use `?` for placeholders.
- `bind: any[]` — positional params, same order as `?` in `sql`.
- `rowMode: 'object'` — return rows as `{ colName: value }`. Omit to get arrays.
- `dbId: string` — always pass the module-level `dbId`.
- Returns `{ result: { resultRows, columnNames, ... } }`. Read rows via `result.result.resultRows`.
- `resultRows` is `[]` for statements that produce no rows (DDL, INSERT/UPDATE/DELETE). It is never `undefined` in practice, but helpers in this repo defensively `|| []` it.

### Query helper pattern

```ts
export async function listX(): Promise<X[]> {
  const promiser = await initDatabase();
  const result = await promiser('exec', {
    sql: 'SELECT ... FROM x WHERE ... ORDER BY ...',
    bind: [/* params */],
    rowMode: 'object',
    dbId,
  });
  return result.result.resultRows || [];
}
```

INSERT/UPDATE/DELETE: same shape, omit `rowMode`, ignore the result. Use `INSERT ... ON CONFLICT(...) DO UPDATE SET ...` for upserts (`ON CONFLICT` form is what the repo standardizes on; the older `INSERT OR REPLACE` works but is not preferred — it deletes and re-inserts the row).

## Forbidden moves

Things that look reasonable but will break something:

- **Don't add a second `useEffect` that calls `initDatabase()` with its own guard.** It's already memoized; a parallel guard can race with the fallback path and end up with two `dbId`s in flight.
- **Don't bypass the `isDbReady` gate** by rendering children that hit the DB synchronously. They will run before the schema exists.
- **Don't remove COOP/COEP headers** from `vite.config.ts` (`server.headers`). SQLite-WASM's OPFS VFS requires a cross-origin-isolated context. The same headers must be set on whatever production server hosts the build.
- **Don't drop `@sqlite.org/sqlite-wasm` from `optimizeDeps.exclude`.** Vite's pre-bundler rewrites worker URLs and breaks loading.
- **Don't do destructive schema changes** (DROP COLUMN, rename) inside `initDatabase`. The migration runs on every load against whatever state the user's OPFS DB is already in. Use additive migrations + a `PRAGMA table_info` check (see the original `migrateDatabase` shape in git history for the pattern) and gate each step on its check.
- **Don't string-interpolate SQL** (repeated for emphasis — it's the most common slip).
- **Don't introduce a second persistence layer** (localStorage, IndexedDB) for app data. Everything goes through SQLite. The exception is the PWA service worker's own Workbox cache, which is managed by `vite-plugin-pwa`.

## Out of scope (flag before implementing)

If a request implies any of these, surface it explicitly before writing code — they all require architectural decisions that aren't made yet:

- **Tests.** No runner is configured. Don't add one ad-hoc; ask which framework and what scope (unit vs. integration with a real OPFS in headless Chrome) the user wants.
- **Auth / user accounts.** There is no user concept. The DB is per-origin, per-browser.
- **Sync / multi-device / backup.** OPFS is local-only and not exportable through normal browser sync. Cross-device support needs a server or a chosen sync protocol (CRDT, last-write-wins, etc.) — that's a real decision.
- **Backend / API calls.** There is no server. Adding one inverts the local-first model.
- **Server-side rendering.** The app depends on browser-only APIs (Worker, OPFS); SSR is a non-starter without significant rework.

## Mental model: the async boundary

```
main thread (React)  ──►  promiser (async API)  ──►  Web Worker  ──►  sqlite-wasm  ──►  OPFS file
```

- Every DB call is async. There is no synchronous escape hatch.
- The worker is single-threaded; concurrent `exec` calls are serialized by the worker, so transactions are safe without app-level locking, but a slow query blocks the next one.
- The UI thread never touches the wasm or the OPFS file directly — it only awaits the promiser.
- "DB ready" means: worker spawned, DB opened (OPFS or `:memory:`), schema + migrations applied. Until `initDatabase()` resolves, none of those are guaranteed.
- On unsupported browsers, the OPFS open throws and the fallback to `:memory:` is silent (a `console.warn` is logged). The app appears to work but data is lost on reload — check the console if persistence seems broken.

<!-- SPECKIT START -->
**Active Feature**: Workout Log Table (branch `001-workout-log-table`)  
For implementation context, design decisions, data model, and step-by-step quickstart, see:
- **Plan**: `specs/001-workout-log-table/plan.md`
- **Data Model**: `specs/001-workout-log-table/data-model.md`
- **Quickstart**: `specs/001-workout-log-table/quickstart.md`
<!-- SPECKIT END -->
