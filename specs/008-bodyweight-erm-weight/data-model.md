# Data Model: Persisted eRM & Optional Weight Entry

**Feature**: 008-bodyweight-erm-weight  
**Date**: 2026-05-31

## Schema Changes

### workout_set — two changes

| Column | Before | After |
|--------|--------|-------|
| `weight` | `REAL NOT NULL` | `REAL` (nullable) |
| `erm` | _(does not exist)_ | `REAL` (nullable, new) |

**weight nullability**: `null` = user left field empty (effective weight comes entirely from body weight for BW/assisted exercises). `0` = user explicitly typed zero. Both are treated the same in eRM calculation (`loggedWeight ?? 0`), but are stored and displayed differently (`null` → `—`, `0` → `0`).

**erm**: Computed and stored at save time. `null` when body weight is absent, when effective weight ≤ 0, or when the set was logged before this feature shipped (pre-existing rows get `NULL` by default from `ADD COLUMN`).

### No change to routine_exercise

`routine_exercise` has no weight column and none is added. The routine-execution form allows empty/0 weight fields naturally; the fix is in the form's submit filter (see quickstart).

### No change to app_setting or exercise

Body weight storage and exercise classification are unchanged from feature 007.

---

## Migration: drizzle/0006_persisted_erm.sql

Two operations in one migration file:

**Step 1 — Add erm column** (no table rebuild needed; nullable ADD COLUMN is safe in SQLite):

```sql
ALTER TABLE `workout_set` ADD COLUMN `erm` real;
```

**Step 2 — Make weight nullable** (requires table rebuild — SQLite cannot drop NOT NULL inline):

```sql
CREATE TABLE `__new_workout_set` (
  `id`         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `reps`       integer NOT NULL,
  `set_number` integer NOT NULL,
  `weight`     real,
  `erm`        real,
  `workout_id` integer NOT NULL,
  FOREIGN KEY (`workout_id`) REFERENCES `workout_log`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT "set_number_check" CHECK("__new_workout_set"."set_number" BETWEEN 1 AND 5),
  CONSTRAINT "reps_check"       CHECK("__new_workout_set"."reps" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_workout_set` (`id`, `reps`, `set_number`, `weight`, `erm`, `workout_id`)
SELECT `id`, `reps`, `set_number`, `weight`, NULL, `workout_id` FROM `workout_set`;
--> statement-breakpoint
DROP TABLE `workout_set`;
--> statement-breakpoint
ALTER TABLE `__new_workout_set` RENAME TO `workout_set`;
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_set_workout_id_set_number_unique`
  ON `workout_set` (`workout_id`, `set_number`);
```

**Note**: The `ADD COLUMN erm` step at the top is superseded by the table rebuild, but keeping it first is harmless and makes the intent explicit in diff review. Alternatively, omit step 1 and include `erm` only in the rebuild — the result is identical.

---

## Drizzle Schema (src/db/schema.ts) — workoutSet change

```ts
export const workoutSet = sqliteTable(
  'workout_set',
  {
    erm: real('erm'),                             // new, nullable
    id: integer('id').primaryKey({ autoIncrement: true }),
    reps: integer('reps').notNull(),
    setNumber: integer('set_number').notNull(),
    weight: real('weight'),                       // was .notNull() — now nullable
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workoutLog.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.workoutId, table.setNumber),
    check('set_number_check', sql`${table.setNumber} BETWEEN 1 AND 5`),
    check('reps_check', sql`${table.reps} > 0`),
  ],
);
```

---

## WorkoutTableRow type change (src/database.ts)

```ts
export type WorkoutTableRow = {
  exercise_name: string;
  id: number;
  Set1_erm:    null | number;   // new
  Set1_reps:   null | number;
  Set1_weight: null | number;
  Set2_erm:    null | number;   // new
  Set2_reps:   null | number;
  Set2_weight: null | number;
  Set3_erm:    null | number;   // new
  Set3_reps:   null | number;
  Set3_weight: null | number;
  Set4_erm:    null | number;   // new
  Set4_reps:   null | number;
  Set4_weight: null | number;
  Set5_erm:    null | number;   // new
  Set5_reps:   null | number;
  Set5_weight: null | number;
  workout_date: string;
};
```

---

## Effective Weight & eRM Computation

`computeEffectiveWeight` in `src/utils/erm.ts` currently takes `loggedWeight: number`. It must accept `null | number`:

```ts
export const computeEffectiveWeight = (parameters: {
  bodyWeight: null | number;
  classification: ExerciseClassification;
  loggedWeight: null | number;   // null treated as 0
}): null | number => {
  const { bodyWeight, classification, loggedWeight } = parameters;
  const weight = loggedWeight ?? 0;

  if (classification === 'standard') {
    return weight <= 0 ? null : weight;
  }

  if (bodyWeight === null) return null;

  const effective = bodyWeight + weight;
  return effective <= 0 ? null : effective;
};
```

**Note**: Standard exercises with null weight should not arise (validation blocks it), but returning `null` is a safe default.
