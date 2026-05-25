# Contract: `src/database.ts`

**Branch**: `003-orm-migrations` | **Phase**: 1 (Design)

This file is the **sole public API** for all database access. No other file in `src/` may import from `@sqlite.org/sqlite-wasm`, `drizzle-orm`, or internal `src/db/*` modules directly. Components and pages import only from `src/database.ts`.

---

## Exported Types

```ts
// Inferred from Drizzle schema (replaces hand-written types)
export type WorkoutSet = typeof workoutSet.$inferSelect;
// { id: number; workoutId: number; setNumber: number; weight: number; reps: number }

export type WorkoutLog = typeof workoutLog.$inferSelect;
// { id: number; workoutDate: string; exerciseName: string; createdAt: string | null; updatedAt: string | null }

// Composite type for UI display (pivot query, not a Drizzle type)
export type WorkoutTableRow = {
  id: number;
  workout_date: string;
  exercise_name: string;
  Set1_weight: number | null; Set1_reps: number | null;
  Set2_weight: number | null; Set2_reps: number | null;
  Set3_weight: number | null; Set3_reps: number | null;
  Set4_weight: number | null; Set4_reps: number | null;
  Set5_weight: number | null; Set5_reps: number | null;
};

export type WorkoutWithSets = WorkoutLog & { sets: WorkoutSet[] };

// Thrown when a migration fails
export class MigrationError extends Error {
  migrationName: string;
  cause: unknown;
}
```

---

## Exported Functions

### `initDatabase(): Promise<void>`

Initializes the SQLite worker, opens the OPFS (or `:memory:`) database, runs pending migrations, and validates the schema. Memoized — subsequent calls return the same promise. Resolves when the DB is fully ready. Rejects with `MigrationError` if any migration fails.

**Called by**: `App.tsx` `useEffect` (already gates on this). `isDbReady` state is set to `true` on resolution.

**Changed from current**: Return type changes from `Promise<Promiser>` to `Promise<void>`. Callers no longer receive or use the promiser directly; all query helpers are self-contained.

---

### Workout helpers (unchanged signatures)

```ts
export function createWorkout(
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ weight: number; reps: number }>,
): Promise<number>   // returns new workout id

export function listWorkouts(): Promise<WorkoutTableRow[]>

export function getWorkoutById(id: number): Promise<WorkoutWithSets | null>

export function updateWorkout(
  id: number,
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ weight: number; reps: number }>,
): Promise<void>

export function deleteWorkout(id: number): Promise<void>
```

`listWorkouts` returns a pivot-style row (Set1_weight … Set5_reps). This query uses the MAX(CASE …) pattern which is not expressible via Drizzle's query builder — it is kept as a raw SQL call through the promiser (the `export`/`import`/`exec` commands that don't map to Drizzle are the only valid exception to the "use Drizzle" rule).

**Alternative for `listWorkouts`**: Use Drizzle's relational queries to fetch workouts with their sets and pivot in JS. This is simpler to maintain. Decision deferred to implementation — either approach is valid as long as the returned `WorkoutTableRow` shape is identical.

---

### Export / Import helpers (unchanged signatures)

```ts
export function exportDatabaseBytes(): Promise<Uint8Array>
export function replaceDatabaseAndReload(bytes: Uint8Array): Promise<never>
```

These use the raw promiser `export` and `close` commands, which have no Drizzle equivalent. They continue to call the internal driver directly and are the **only** functions in `database.ts` that bypass the Drizzle query builder. This is explicitly permitted because they operate on the database file, not on rows.

---

## Dev-only export (tree-shaken in production)

```ts
// Only available when import.meta.env.DEV === true
export async function __devRollback(migrationName: string): Promise<void>
```

Executes the down-migration SQL for the named migration file and removes its record from `__drizzle_migrations`. Never called automatically. Intended for use in the browser console during development.

---

## Internal module dependency graph

```
src/database.ts          ← sole public API
  ├── src/db/driver.ts   ← promiser factory, open(), dbId management
  ├── src/db/schema.ts   ← Drizzle table definitions
  ├── src/db/orm.ts      ← drizzle(proxy) instance
  ├── src/db/migrations.ts  ← runMigrations()
  └── src/db/validator.ts   ← validateSchema()
```

No file outside `src/database.ts` may import from `src/db/*`.

---

## Invariants preserved from current implementation

| Invariant | How preserved |
|-----------|--------------|
| Single worker | `createWorker()` in `driver.ts` is called once; `databasePromise` memoizes |
| Single dbId at module scope | `driver.ts` owns a module-level `let dbId` |
| All schema work before ready | `runMigrations` + `validateSchema` complete inside `initDatabase` before it resolves |
| No SQL string interpolation | Drizzle query builder handles parameterization; raw SQL strings only in committed `.sql` migration files |
| No second persistence layer | No localStorage/IndexedDB added |
| COOP/COEP headers untouched | No `vite.config.ts` changes |
