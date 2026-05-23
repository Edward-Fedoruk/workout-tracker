# Research: Drizzle ORM + sqlite-wasm Migration System

**Branch**: `003-orm-migrations` | **Phase**: 0 (Research)

---

## Decision 1: Drizzle adapter for sqlite-wasm

**Decision**: Use `drizzle-orm/sqlite-proxy` to wrap the existing `sqlite3Worker1Promiser` as a Drizzle driver.

**Rationale**: The proxy adapter accepts an async execute function `(sql, params, method) => Promise<{ rows }>`, making it the only Drizzle adapter that works with a worker-based async API. All other SQLite adapters (`better-sqlite3`, `bun:sqlite`) are synchronous and Node/Bun-only. The proxy driver preserves the single-worker, single-dbId invariant from Principle II — the promiser is still the sole handle; Drizzle simply calls it.

**Alternatives considered**:
- `drizzle-orm/libsql` — targets `@libsql/client`, not sqlite-wasm; would require replacing the DB engine entirely.
- Direct `drizzle-orm` with custom dialect — undocumented, fragile, and effectively the same as the proxy approach but without official support.
- A different ORM (Prisma, Kysely) — Prisma requires a server-side query engine; Kysely has no built-in migration runner and requires its own dialect shim. Drizzle proxy is the least-friction path.

---

## Decision 2: Migration file strategy

**Decision**: Drizzle Kit CLI generates SQL migration files into `drizzle/` at dev time. Vite bundles them into the app via `import.meta.glob('../../drizzle/*.sql', { query: '?raw', import: 'default', eager: true })`. The migration runner executes them in lexicographic (sequential) order on startup.

**Rationale**: Migration SQL files are committed to the repo alongside schema changes. Vite 5's glob import with `?raw` inlines the SQL strings at build time — no network fetch required, fully offline-capable. Lexicographic sort on `0001_init.sql`, `0002_add_users.sql`, etc. gives deterministic ordering.

**Alternatives considered**:
- Fetching SQL files at runtime from the Vite public folder — requires network access, breaks offline/PWA guarantees.
- Encoding migrations as TypeScript strings — works but sacrifices Drizzle Kit's ability to diff schemas and generate correct SQL automatically.
- Using Drizzle Kit's `migrate()` helper — designed for Node.js; reads from the filesystem, not from bundled assets. Cannot run in a browser worker.

---

## Decision 3: Migration tracking table

**Decision**: Track applied migrations in a `__drizzle_migrations` table (columns: `id INTEGER PK AUTOINCREMENT`, `name TEXT NOT NULL UNIQUE`, `applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`). Create this table inside the migration runner before the first migration runs.

**Rationale**: Drizzle Kit's journal (`drizzle/meta/_journal.json`) is for the CLI toolchain, not the runtime. The runtime needs its own record of what has been applied. Using a dedicated table in the same SQLite file is idiomatic (matches how Drizzle's Node.js migrator works) and keeps state in the single source of truth.

**Alternatives considered**:
- Storing applied migration names in the `kv` table — would work but conflates infrastructure with app data; makes `kv` harder to wipe cleanly.
- PRAGMA `user_version` — limited to a single integer, cannot track individual migration names.

---

## Decision 4: Schema validation approach (FR-010)

**Decision**: After migrations complete, validate each table defined in `src/db/schema.ts` against `PRAGMA table_info(tableName)`. Check that every Drizzle-defined column name is present in the live table. Fail `initDatabase` with a descriptive error if any column is missing.

**Rationale**: Full Drizzle schema diffing (`drizzle-kit introspect`) requires the CLI and Node.js. In the browser, `PRAGMA table_info` is the only introspection API available. Column-presence validation catches the most dangerous mismatch: code querying a column that doesn't exist. It will not catch type changes (e.g., INTEGER → TEXT), which are already forbidden by Principle III (additive-only migrations).

**Alternatives considered**:
- Full diff via serializing Drizzle schema metadata and comparing to `PRAGMA table_info` results including types — feasible but complex; type affinity rules in SQLite make type string matching unreliable.
- Skipping validation — violates FR-010 explicitly.
- Trusting migration history alone — misses the case where the user's OPFS DB was modified externally.

---

## Decision 5: Source code structure (Principle VIII compliance)

**Decision**: Extract the current monolithic `src/database.ts` (419 lines) into:

```
src/db/
├── driver.ts       # promiser factory, open(), dbId state, requireDatabaseId()
├── schema.ts       # Drizzle table definitions (kv, workout_log, workout_set)
├── orm.ts          # drizzle() instance wrapping the driver
├── migrations.ts   # runMigrations() — reads glob-bundled SQL, tracks in __drizzle_migrations
└── validator.ts    # validateSchema() — PRAGMA table_info checks per Drizzle table

src/database.ts     # initDatabase() orchestrator + all public typed helpers (≤200 lines)
```

`database.ts` stays as the sole public API surface (Principle II: "all DB access MUST go through typed helpers exported from `src/database.ts`"). Internal `db/` files are private infrastructure.

**Rationale**: At 419 lines `database.ts` already violates the 200-line soft limit (Principle VIII). The feature adds migration + validation logic, which would push it further. Splitting along concern boundaries (driver, schema, ORM, migrations, validation) keeps each file focused and under limit.

**Alternatives considered**:
- Keeping everything in `database.ts` — direct violation of Principle VIII; reviewer flag required.
- Exporting the Drizzle `db` instance for direct use in components — violates Principle II which mandates all DB access through typed helpers in `database.ts`.

---

## Decision 6: Error recovery for failed migrations (FR-008)

**Decision**: `initDatabase` throws a typed `MigrationError` (wrapping the original error and the failing migration name). `App.tsx` catches this before rendering and shows a modal with two options: (1) **Retry** (calls `location.reload()`) and (2) **Reset database** (wipes OPFS and reloads). This is a purely additive UI change with no new persistence layer.

**Rationale**: The spec clarification Q1 specifies "block startup with clear error; offer user choice to retry or instantiate fresh empty database." A blocking modal before `isDbReady` fits the existing `App.tsx` gate pattern and requires no new architectural layer.

**Alternatives considered**:
- Silently falling back to `:memory:` — would hide migration failures; data would appear to work but all changes lost on reload.
- A global error boundary — React error boundaries don't catch async errors outside render; the init error must be caught imperatively in the `useEffect` that calls `initDatabase`.

---

## Decision 7: Rollback capability (FR-006)

**Decision**: Drizzle Kit generates rollback (down) migration files alongside forward migrations when `drizzle-kit generate` is run. These are committed but **never executed automatically**. A developer can manually run a down migration in the browser console via a helper function `__devRollback(migrationName)` exported only in dev builds (`import.meta.env.DEV`).

**Rationale**: The spec scopes rollback to local development only ("production migrations are forward-only"). Exposing a `__devRollback` function in the dev build satisfies FR-006 without adding production complexity. In production builds, tree-shaking removes it.

**Alternatives considered**:
- A dedicated dev UI for rollback — over-engineered for a dev-only tool.
- Automatic rollback on failure — dangerous in production; spec explicitly limits this to dev.

---

## Package versions

| Package | Version | Role |
|---------|---------|------|
| `drizzle-orm` | 0.45.x | ORM, query builder, proxy driver |
| `drizzle-kit` | 0.31.x | CLI: schema diff, migration generation |
