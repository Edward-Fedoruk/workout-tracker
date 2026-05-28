# Data Model: Rep Range for Routine Exercises

## Changed Entity: `routine_exercise`

### Before

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| routine_id | INTEGER | NOT NULL, FK → routine.id ON DELETE CASCADE |
| exercise_name | TEXT | NOT NULL |
| position | INTEGER | NOT NULL, ≥ 1 |
| suggested_sets | INTEGER | NOT NULL, BETWEEN 1 AND 5 |
| suggested_reps | INTEGER | NOT NULL, BETWEEN 1 AND 99 |

### After

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| routine_id | INTEGER | NOT NULL, FK → routine.id ON DELETE CASCADE |
| exercise_name | TEXT | NOT NULL |
| position | INTEGER | NOT NULL, ≥ 1 |
| suggested_sets | INTEGER | NOT NULL, BETWEEN 1 AND 5 |
| min_reps | INTEGER | NOT NULL, BETWEEN 1 AND 99 |
| max_reps | INTEGER | NOT NULL, BETWEEN 1 AND 99 |

### New Constraints

- `min_reps_check`: `min_reps BETWEEN 1 AND 99`
- `max_reps_check`: `max_reps BETWEEN 1 AND 99`
- `reps_range_check`: `min_reps <= max_reps` (application-level validation; also expressible as a DB check constraint)

---

## Migration

**File**: `drizzle/0004_reps_range.sql` (name assigned by drizzle-kit)

**Steps** (executed in one transaction):
1. `ALTER TABLE routine_exercise ADD COLUMN min_reps INTEGER NOT NULL DEFAULT 10`
2. `ALTER TABLE routine_exercise ADD COLUMN max_reps INTEGER NOT NULL DEFAULT 10`
3. `UPDATE routine_exercise SET min_reps = suggested_reps, max_reps = suggested_reps`
4. `ALTER TABLE routine_exercise DROP COLUMN suggested_reps`

**Invariant**: After step 3 and before step 4, every row has `min_reps = max_reps = (old) suggested_reps`. The DEFAULT 10 in steps 1–2 is a migration scaffold value only; no row retains it.

---

## Drizzle Schema Changes (`src/db/schema.ts`)

Remove from `routineExercise`:
```ts
suggestedReps: integer('suggested_reps').notNull(),
// and its check constraint: check('suggested_reps_check', ...)
```

Add to `routineExercise`:
```ts
minReps: integer('min_reps').notNull(),
maxReps: integer('max_reps').notNull(),
// check constraints:
check('min_reps_check', sql`${table.minReps} BETWEEN 1 AND 99`),
check('max_reps_check', sql`${table.maxReps} BETWEEN 1 AND 99`),
```

---

## TypeScript Type Impact

`RoutineExercise` is `typeof routineExercise.$inferSelect`. After the schema change:

- **Removed**: `suggestedReps: number`
- **Added**: `minReps: number`, `maxReps: number`

All callsites that reference `exercise.suggestedReps` will produce a TypeScript error, surfacing every location that needs updating.

**Affected callsites** (compile-time errors expected after schema change):
- `src/db/routineHelpers.ts` — `addRoutineExercise`, `updateRoutineExercise` parameter names
- `src/components/routines/RoutineEditor.tsx` — form state init and `openEditExercise`
- `src/components/routines/ExerciseRow.tsx` — display line `{exercise.suggestedReps}`
- `src/components/routines/RoutineWorkoutExercise.tsx` — guidance label and initial values computation

---

## No Other Entities Affected

- `routine`: unchanged
- `workout_log`, `workout_set`: unchanged (rep range is planning guidance only; logged reps remain free-form)
- `exercise`, `muscle_group`, `exercise_muscle_group`: unchanged
