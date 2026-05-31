# Data Model: eRM & Body Weight Settings

**Feature**: `007-erm-bodyweight` | **Date**: 2026-05-29

## Schema Changes

### 1. New table: `app_setting`

A generic key-value store for application-wide settings. This feature adds the `body_weight` key.

```sql
CREATE TABLE IF NOT EXISTS `app_setting` (
  `key`   TEXT NOT NULL PRIMARY KEY,
  `value` TEXT NOT NULL
);
```

**Row inserted/updated by this feature**:

| key            | value example | Description                                      |
|----------------|---------------|--------------------------------------------------|
| `body_weight`  | `"75.25"`     | User's body weight in kg; up to 2 decimal places. NULL-free (absent key = "not set"). |

**Notes**:
- Body weight is stored as a TEXT string (decimal representation) for consistency with how SQLite-WASM stores numeric values in key-value scenarios. The application layer parses it with `parseFloat` and rounds to 2 decimal places before display/calculation.
- When body weight has never been set, the row is simply absent. All code that reads body weight must handle the "key not found" case and treat it as `null`.

---

### 2. New column: `exercise.classification`

Added via `ALTER TABLE`. Existing rows default to `'standard'`.

```sql
ALTER TABLE `exercise`
  ADD COLUMN `classification` TEXT NOT NULL DEFAULT 'standard'
  CHECK(`classification` IN ('standard', 'bodyweight', 'assisted'));
```

**Classification semantics**:

| Value         | Meaning                                                                                      | Effective weight formula              |
|---------------|----------------------------------------------------------------------------------------------|---------------------------------------|
| `standard`    | Standard barbell/dumbbell/machine exercise; body weight does not contribute to the load.      | `effective = logged_weight`           |
| `bodyweight`  | Body-weight exercise (pull-up, dip, push-up, etc.); body weight is always in the load.       | `effective = body_weight + logged_weight` |
| `assisted`    | Assisted machine variant; machine provides a counter-force, entered as a negative logged weight. | `effective = body_weight + logged_weight` (logged_weight is negative) |

**Drizzle schema update** (`src/db/schema.ts`):
```ts
export const exercise = sqliteTable(
  'exercise',
  {
    classification: text('classification', {
      enum: ['standard', 'bodyweight', 'assisted'],
    }).notNull().default('standard'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
  },
  (table) => [
    check(
      'exercise_classification_check',
      sql`${table.classification} IN ('standard', 'bodyweight', 'assisted')`,
    ),
  ],
);
```

---

### 3. Modified table: `workout_set` — drop `weight_check` constraint

The existing `CHECK("workout_set"."weight" > 0)` constraint prevents negative weights, which are required for assisted exercises. The constraint is removed; validation moves to the application layer.

**Migration approach**: Table-rebuild (same pattern as `0004_reps_range.sql`).

```sql
CREATE TABLE `__new_workout_set` (
  `id`         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workout_id` integer NOT NULL,
  `set_number` integer NOT NULL,
  `weight`     real NOT NULL,
  `reps`       integer NOT NULL,
  FOREIGN KEY (`workout_id`) REFERENCES `workout_log`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT "set_number_check" CHECK("__new_workout_set"."set_number" BETWEEN 1 AND 5),
  CONSTRAINT "reps_check"       CHECK("__new_workout_set"."reps" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_workout_set` SELECT `id`, `workout_id`, `set_number`, `weight`, `reps` FROM `workout_set`;
--> statement-breakpoint
DROP TABLE `workout_set`;
--> statement-breakpoint
ALTER TABLE `__new_workout_set` RENAME TO `workout_set`;
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_set_workout_id_set_number_unique` ON `workout_set` (`workout_id`, `set_number`);
```

**Drizzle schema update** (`src/db/schema.ts`):

Remove the `check('weight_check', ...)` line from `workoutSet`. Keep `set_number_check` and `reps_check`.

**Application-layer weight rules** (enforced in `WorkoutForm`):
- `standard`: `weight > 0`
- `bodyweight`: `weight >= 0`
- `assisted`: any finite number (including negative)

---

## Derived Value: eRM

eRM is **not stored**. It is computed at render time.

**Formula (Epley)**:

```
effectiveWeight =
  classification === 'standard'  → loggedWeight
  classification === 'bodyweight' → bodyWeight + loggedWeight
  classification === 'assisted'  → bodyWeight + loggedWeight

eRM = effectiveWeight × (1 + reps / 30)
```

**Guard conditions** (render placeholder `"—"` instead of a number):
- `classification` is `'bodyweight'` or `'assisted'` AND body weight is not set (key absent).
- `effectiveWeight <= 0` (e.g., assisted machine assistance ≥ body weight).
- `reps <= 0` (should never reach display but guard defensively).

**Location**: `src/utils/erm.ts` — pure exported functions, no async, no DB access.

---

## TypeScript Type Updates

### `Exercise` type (in `src/db/exerciseHelpers.ts`)

Add `classification` field:
```ts
export type ExerciseClassification = 'standard' | 'bodyweight' | 'assisted';

export type Exercise = {
  classification: ExerciseClassification;
  createdAt: string;
  id: number;
  muscleGroups: MuscleGroup[];
  name: string;
};
```

### Body weight setting

Returned from `getBodyWeight()` as `number | null` (null = not set).

---

## Migration File Name

Next sequential file: **`0005_erm_bodyweight.sql`**

Contents (in order, separated by `-- > statement-breakpoint`):
1. `CREATE TABLE IF NOT EXISTS app_setting ...`
2. `ALTER TABLE exercise ADD COLUMN classification ...`
3. Table-rebuild for `workout_set` (drop `weight_check`)
