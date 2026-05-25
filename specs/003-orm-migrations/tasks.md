# Tasks: Drizzle ORM with Database Migrations

**Input**: Design documents from `specs/003-orm-migrations/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/database.ts.md ✅

**Tests**: No test tasks — no test runner configured (Principle V).

**Organization**: Tasks follow the execution dependency order — US3 (schema definition) must precede US1 (migration runner), which must precede US2 (ORM query refactor).

> **Note on story ordering**: All three stories are P1 but have a hard dependency chain — US3 → US1 → US2. Phases reflect this execution order, not spec order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to

## Path Conventions

Single project layout: `src/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Drizzle dependencies and configure the toolchain.

- [x] T001 Add `drizzle-orm` (production) and `drizzle-kit` (dev) to `package.json` and run `npm install`
- [x] T002 Create `drizzle.config.ts` at repo root — set `schema: './src/db/schema.ts'`, `out: './drizzle'`, `dialect: 'sqlite'`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract the SQLite worker/promiser infrastructure from `src/database.ts` into `src/db/driver.ts`. All subsequent phases depend on this separation.

**⚠️ CRITICAL**: Phases 3–5 cannot begin until this phase is complete.

- [x] T003 Extract promiser infrastructure from `src/database.ts` into `src/db/driver.ts` — move `createPromiser()`, `open()`, module-level `databasePromise` and `databaseId`, `requireDatabaseId()`; export a `getDbId()` helper and a `getPromiser()` helper that returns the memoized promiser; update `src/database.ts` to import from `src/db/driver.ts`

**Checkpoint**: `npm run typecheck` passes; `src/database.ts` imports driver helpers; all existing CRUD helpers still work.

---

## Phase 3: User Story 3 — Schema Defined via Drizzle (Priority: P1)

**Goal**: Replace inline `createSchema()` DDL strings with Drizzle table definitions as the single source of truth for the database schema.

**Independent Test**: Run `npx drizzle-kit generate` — it should produce `drizzle/0001_init.sql` with `CREATE TABLE` statements that are structurally equivalent to the existing `createSchema()` DDL in `src/database.ts`.

- [x] T004 [US3] Create `src/db/schema.ts` — define `workoutLog` and `workoutSet` Drizzle tables matching the existing DDL in `src/database.ts` `createSchema()`: same column names, types, constraints (FK with cascade, UNIQUE on `(workout_id, set_number)`, CHECK constraints on `set_number`, `weight`, `reps`); use `sql\`CURRENT_TIMESTAMP\`` for date defaults
- [x] T005 [US3] Run `npx drizzle-kit generate` from repo root to produce `drizzle/0001_init.sql` and `drizzle/meta/` — commit all generated files
- [x] T006 [US3] Verify `drizzle/0001_init.sql` — manually confirm the generated SQL creates `workout_log` and `workout_set` with equivalent structure to the removed `createSchema()` DDL; amend schema and regenerate if any column, constraint, or FK differs

**Checkpoint**: `drizzle/0001_init.sql` and `drizzle/meta/` are committed; `npx drizzle-kit generate` reports "No changes" on a second run; TypeScript compiles.

---

## Phase 4: User Story 1 — Database Migrations Execute at App Startup (Priority: P1)

**Goal**: On every app start, pending migration files are discovered, executed in order, and recorded; failed or inconsistent states block startup with a recovery modal.

**Independent Test**: (1) Clear OPFS (DevTools → Application → Storage → Clear site data), start app — `__drizzle_migrations` table should contain one row for `0001_init.sql`. (2) Restart — no error, row count unchanged. (3) Delete `drizzle/0001_init.sql` temporarily — app should show error modal on startup.

- [x] T007 [US1] Create `src/db/migrations.ts` — export `runMigrations(promiser, dbId)`: creates `__drizzle_migrations` table (`CREATE TABLE IF NOT EXISTS`), loads SQL files via `import.meta.glob('../../drizzle/*.sql', { query: '?raw', import: 'default', eager: true })`, sorts by filename, checks applied set against `__drizzle_migrations`, throws `MigrationError` if any applied migration's file is missing (FR-011), executes pending migrations wrapped in `BEGIN`/`COMMIT` transaction, records each applied migration; logs each run to `console.log` with timestamp (FR-007)
- [x] T008 [P] [US1] Create `src/db/validator.ts` — export `validateSchema(promiser, dbId)`: for each table exported from `src/db/schema.ts`, runs `PRAGMA table_info(tableName)` and checks every Drizzle-defined column name is present in the result; throws `MigrationError` with the missing column details if validation fails (covers FR-010 including schema-ahead-of-code case)
- [x] T009 [P] [US1] Create `src/components/MigrationErrorDialog.tsx` — MUI `Dialog` that accepts `error: MigrationError` and `onReset: () => void` props; shows error message and migration name; "Retry" button calls `location.reload()`; "Reset Database" button calls `onReset` (which wipes OPFS and reloads); both buttons meet 44×44px touch target minimum; dialog is not dismissible (no backdrop click / escape close)
- [x] T010 [US1] Add `MigrationError` class to `src/database.ts` (fields: `migrationName: string`, `override cause: unknown`); update `initDatabase()` — change return type from `Promise<Promiser>` to `Promise<void>`, call `runMigrations()` then `validateSchema()` inside the memoized async block before resolving, throw `MigrationError` on any failure; update all internal helpers that previously did `const promiser = await initDatabase()` to use `getPromiser()` from `src/db/driver.ts` instead
- [x] T011 [US1] Remove `createSchema()` function and its DDL from `src/database.ts` — schema is now managed exclusively by migration files; remove the `createSchema(promiser, id)` call from `initDatabase()`
- [x] T012 [US1] Update `src/App.tsx` — add `migrationError: MigrationError | null` state; in the `initDatabase()` `useEffect`, catch `MigrationError` and set `migrationError`; render `<MigrationErrorDialog>` when `migrationError` is set (before the `isDbReady` gate); implement `handleReset` — wipes OPFS (`app.sqlite3` and WAL/SHM files) then calls `location.reload()`

**Checkpoint**: App starts on fresh DB, executes `0001_init.sql`, `__drizzle_migrations` has one row; subsequent restarts are idempotent; schema mismatch or missing migration file shows recovery modal with Retry and Reset buttons.

---

## Phase 5: User Story 2 — Use Drizzle ORM for Database Queries (Priority: P1)

**Goal**: All CRUD helpers in `src/database.ts` use the Drizzle query builder instead of raw SQL strings; TypeScript provides column-level type safety via inferred schema types.

**Independent Test**: (1) Add a workout via the UI — data is created correctly. (2) Edit a workout — update persists. (3) Delete a workout — row and its sets are removed. (4) Export database — file downloads. (5) Hover over a column access in an IDE to confirm TypeScript autocomplete shows the column type.

- [x] T013 [US2] Create `src/db/orm.ts` — create and export a `db` instance via `drizzle(sqlite-proxy)`: the async execute function awaits `initDatabase()` (memoized — safe), retrieves promiser and dbId from `src/db/driver.ts`, calls `promiser('exec', { sql, bind: params, rowMode: 'object', dbId })`; returns `{ rows: result.result.resultRows ?? [] }` for `all`/`get`, `{ rows: [] }` for `run`; import schema from `src/db/schema.ts`
- [x] T014 [P] [US2] Replace hand-written `WorkoutSet`, `WorkoutWithSets` types in `src/database.ts` with Drizzle-inferred types (`typeof workoutSet.$inferSelect`, etc.); keep `WorkoutTableRow` as a manual type (pivot shape has no Drizzle equivalent)
- [x] T015 [US2] Refactor `createWorkout` in `src/database.ts` to use `db.insert(workoutLog).values(...)` and `db.insert(workoutSet).values(...)`; use `sql\`last_insert_rowid()\`` for the insert ID; remove raw INSERT strings
- [x] T016 [P] [US2] Refactor `getWorkoutById` in `src/database.ts` to use `db.select().from(workoutLog).where(eq(workoutLog.id, id))` and `db.select().from(workoutSet).where(eq(workoutSet.workoutId, id)).orderBy(workoutSet.setNumber)`
- [x] T017 [P] [US2] Refactor `updateWorkout` in `src/database.ts` to use `db.update(workoutLog).set({ workoutDate, exerciseName, updatedAt: sql\`CURRENT_TIMESTAMP\` }).where(eq(workoutLog.id, id))`, `db.delete(workoutSet).where(eq(workoutSet.workoutId, id))`, and `db.insert(workoutSet).values(...)`
- [x] T018 [P] [US2] Refactor `deleteWorkout` in `src/database.ts` to use `db.delete(workoutSet).where(eq(workoutSet.workoutId, id))` and `db.delete(workoutLog).where(eq(workoutLog.id, id))`
- [x] T019 [US2] Keep `listWorkouts` as a raw promiser `exec` call (documented FR-004 exception — pivot query not expressible in Drizzle query builder); add a comment above the function citing the exception and referencing `contracts/database.ts.md`
- [x] T020 [US2] Add dev-only `__devRollback(migrationName: string): Promise<void>` export to `src/database.ts` guarded by `if (!import.meta.env.DEV) return`; loads the matching down-migration SQL file (e.g. `drizzle/0001_init.sql` → look for `0001_init_down.sql` or inline `-- down` section), executes it, then runs `DELETE FROM __drizzle_migrations WHERE name = ?` (FR-006)

**Checkpoint**: All CRUD operations work end-to-end; TypeScript reports no errors; `listWorkouts` still returns correct `WorkoutTableRow[]` shape; `exportDatabaseBytes` and `replaceDatabaseAndReload` are unaffected.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, consistency pass, and end-to-end verification.

- [x] T021 [P] Run `npm run typecheck` — resolve any type errors introduced during the refactor
- [x] T022 [P] Run `npm run lint` — resolve any lint errors; confirm no `@sqlite.org/sqlite-wasm` imports outside `src/db/driver.ts`
- [x] T023 Verify `npm run dev` end-to-end: clear site storage, load app — migrations run, CRUD works (create / edit / delete a workout), export downloads a valid SQLite file, import replaces the DB and reloads

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US3 — Schema)**: Depends on Phase 2
- **Phase 4 (US1 — Migrations)**: Depends on Phase 3 (needs `drizzle/0001_init.sql` to exist)
- **Phase 5 (US2 — ORM Queries)**: Depends on Phase 4 (`initDatabase` must be stable before refactoring helpers)
- **Phase 6 (Polish)**: Depends on Phase 5

### User Story Dependencies

- **US3 (P1)**: Starts after Foundational — produces the schema file and the first migration SQL
- **US1 (P1)**: Starts after US3 — needs `drizzle/0001_init.sql` to exist and `src/db/schema.ts` to import from
- **US2 (P1)**: Starts after US1 — needs stable `initDatabase()` (`Promise<void>`) before refactoring all helpers

### Within Each Phase

- Tasks marked [P] within the same phase share no file conflicts and can run in parallel
- T007, T008, T009 within Phase 4 can all start immediately once Phase 3 is complete
- T014, T016, T017, T018 within Phase 5 touch different helpers and can run in parallel

---

## Parallel Opportunities

### Phase 4 (US1 — Migrations)

```
Once Phase 3 completes:
  Task T007: src/db/migrations.ts         ─┐
  Task T008: src/db/validator.ts           ├─ all in parallel
  Task T009: src/components/MigrationErrorDialog.tsx ─┘
  → Then T010 (database.ts initDatabase update, depends on T007+T008)
  → Then T011 (remove createSchema, depends on T010)
  → Then T012 (App.tsx, depends on T009+T010)
```

### Phase 5 (US2 — ORM Queries)

```
Once Phase 4 completes:
  Task T013: src/db/orm.ts  (all others depend on this)
  → Then in parallel:
    Task T014: type replacements
    Task T015: createWorkout
    Task T016: getWorkoutById
    Task T017: updateWorkout
    Task T018: deleteWorkout
  → Then T019: listWorkouts annotation (after T013)
  → Then T020: __devRollback (after T013)
```

---

## Implementation Strategy

### MVP (User Story 1 only — migrations working)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (extract driver.ts)
3. Complete Phase 3: US3 (schema.ts + generate 0001_init.sql)
4. Complete Phase 4: US1 (migration runner, validator, error dialog)
5. **STOP AND VALIDATE**: Clear OPFS, start app — confirm migrations run cleanly
6. Existing CRUD still works (raw SQL path untouched at this point)

### Incremental Delivery

1. Setup + Foundational → driver extraction working
2. US3 complete → schema is Drizzle, first migration file committed
3. US1 complete → automatic migrations on startup, error recovery working
4. US2 complete → all CRUD uses Drizzle, types inferred from schema
5. Polish → lint + typecheck clean, end-to-end verified

---

## Notes

- [P] tasks = different files, no shared dependencies within same phase
- No test tasks — no test runner configured per Principle V
- `listWorkouts` intentionally kept as raw SQL (documented FR-004 exception)
- `exportDatabaseBytes` and `replaceDatabaseAndReload` use raw promiser `export`/`close` commands — these are not SQL queries and are exempt from FR-004
- After Phase 4, if the app fails to start due to migration error, check browser DevTools console for `MigrationError` details before choosing Reset
- `__devRollback` is only available in `npm run dev` builds — it is tree-shaken out of the production bundle
