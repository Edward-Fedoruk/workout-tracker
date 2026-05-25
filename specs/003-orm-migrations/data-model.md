# Data Model: Drizzle ORM + Migration System

**Branch**: `003-orm-migrations` | **Phase**: 1 (Design)

---

## Existing Tables (migrated to Drizzle schema definitions)

### `workout_log`

| Column | SQLite Type | Drizzle | Constraints |
|--------|-------------|---------|-------------|
| `id` | INTEGER | `integer('id')` | PRIMARY KEY AUTOINCREMENT |
| `workout_date` | DATE | `text('workout_date')` | NOT NULL |
| `exercise_name` | TEXT | `text('exercise_name')` | NOT NULL |
| `created_at` | TIMESTAMP | `text('created_at')` | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | `text('updated_at')` | DEFAULT CURRENT_TIMESTAMP |

> Note: SQLite stores DATE and TIMESTAMP as TEXT. Drizzle maps them to `text()` to match the existing column affinity and avoid silent type coercion.

**Drizzle schema**:
```ts
export const workoutLog = sqliteTable('workout_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutDate: text('workout_date').notNull(),
  exerciseName: text('exercise_name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
```

---

### `workout_set`

| Column | SQLite Type | Drizzle | Constraints |
|--------|-------------|---------|-------------|
| `id` | INTEGER | `integer('id')` | PRIMARY KEY AUTOINCREMENT |
| `workout_id` | INTEGER | `integer('workout_id')` | NOT NULL, FK → workout_log(id) ON DELETE CASCADE |
| `set_number` | INTEGER | `integer('set_number')` | NOT NULL, CHECK BETWEEN 1 AND 5 |
| `weight` | REAL | `real('weight')` | NOT NULL, CHECK > 0 |
| `reps` | INTEGER | `integer('reps')` | NOT NULL, CHECK > 0 |
| *(composite)* | | | UNIQUE(workout_id, set_number) |

**Drizzle schema**:
```ts
export const workoutSet = sqliteTable(
  'workout_set',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workoutLog.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    weight: real('weight').notNull(),
    reps: integer('reps').notNull(),
  },
  (table) => ({
    uniqueWorkoutSet: unique().on(table.workoutId, table.setNumber),
    setNumberCheck: check('set_number_check', sql`${table.setNumber} BETWEEN 1 AND 5`),
    weightCheck: check('weight_check', sql`${table.weight} > 0`),
    repsCheck: check('reps_check', sql`${table.reps} > 0`),
  }),
);
```

---

## New Infrastructure Table

### `__drizzle_migrations`

Tracks which migration files have been applied. Created by the migration runner before the first migration executes. Never managed by Drizzle Kit (it is infrastructure, not domain data).

| Column | SQLite Type | Constraints |
|--------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `name` | TEXT | NOT NULL UNIQUE — the `.sql` filename, e.g. `0001_init.sql` |
| `applied_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

Raw DDL (executed by migration runner, not a Drizzle schema):
```sql
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## Migration File Layout

```
drizzle/                         ← Drizzle Kit output folder (committed)
├── 0001_init.sql                ← First migration: creates workout_log, workout_set
└── meta/
    ├── _journal.json            ← Drizzle Kit migration journal (tooling only)
    └── 0001_snapshot.json       ← Schema snapshot for diffing
```

The `0001_init.sql` migration replaces the current `createSchema()` inline DDL in `database.ts`. It must produce an identical schema to what currently exists so that existing OPFS databases skip it (the migration runner checks `__drizzle_migrations` first).

### Existing OPFS databases: upgrade path

Users with an existing OPFS database (pre-migration-runner) will **not** have the `__drizzle_migrations` table. The migration runner creates it on first access (`CREATE TABLE IF NOT EXISTS`). It then checks which migrations have been applied. Since `workout_log` and `workout_set` already exist, `0001_init.sql` will use `CREATE TABLE IF NOT EXISTS` for each table — it is safe to re-run.

> **Important**: `0001_init.sql` MUST use `CREATE TABLE IF NOT EXISTS` (not `CREATE TABLE`) so it is idempotent on databases that already have the tables. This matches the existing `createSchema` behaviour.

---

## Type Inference

Drizzle generates TypeScript types from the schema. Replace current hand-written types in `database.ts` with inferred types:

```ts
// Before (manual)
export type WorkoutSet = { id: number; reps: number; ... };

// After (inferred)
import { workoutSet } from './db/schema';
export type WorkoutSet = typeof workoutSet.$inferSelect;
```

This ensures types stay in sync with the schema definition automatically.

---

## Validation Map (FR-010)

After migrations, `validateSchema()` checks each table:

| Table | Drizzle export | Columns validated |
|-------|---------------|-------------------|
| `workout_log` | `workoutLog` | `id`, `workout_date`, `exercise_name`, `created_at`, `updated_at` |
| `workout_set` | `workoutSet` | `id`, `workout_id`, `set_number`, `weight`, `reps` |

`__drizzle_migrations` is not validated via Drizzle schema (it has no Drizzle definition); its existence is guaranteed by the migration runner itself.
