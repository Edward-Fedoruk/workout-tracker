# Data Model: Workout UI Polish

No new database schema is introduced. One existing type is extended and one existing query is modified.

---

## Modified Type: `WorkoutTableRow`

**File**: `src/db/entities/workout-log/types.ts`

```ts
// Before
export type WorkoutTableRow = {
  exercise_name: string;
  id: number;
  Set1_erm: null | number;
  Set1_reps: null | number;
  Set1_weight: null | number;
  // ... Set2–Set5 ...
  workout_date: string;
};

// After — add one field
export type WorkoutTableRow = {
  exercise_image_filename: null | string;  // ← NEW
  exercise_name: string;
  id: number;
  Set1_erm: null | number;
  Set1_reps: null | number;
  Set1_weight: null | number;
  // ... Set2–Set5 ...
  workout_date: string;
};
```

**Source**: LEFT JOIN `exercise` table on `exercise.name = workout_log.exercise_name`, selecting `e.image_filename AS exercise_image_filename`.

---

## Modified Query: `workoutLogRepository.list()`

**File**: `src/db/entities/workout-log/repository.ts`

The raw SQL pivot query gains one additional JOIN and one additional SELECT column:

```sql
SELECT
  w.id,
  w.workout_date,
  w.exercise_name,
  e.image_filename AS exercise_image_filename,   -- NEW
  MAX(CASE WHEN s.set_number = 1 THEN s.weight END) AS Set1_weight,
  -- ... rest unchanged ...
FROM workout_log w
LEFT JOIN workout_set s ON s.workout_id = w.id
LEFT JOIN exercise e ON e.name = w.exercise_name  -- NEW
GROUP BY w.id, w.workout_date, w.exercise_name, e.image_filename  -- updated GROUP BY
ORDER BY w.workout_date DESC, w.id DESC
```

**Reason `e.image_filename` is in GROUP BY**: SQLite requires all non-aggregate SELECT columns to appear in GROUP BY when not functionally dependent. Adding it is safe because one exercise name maps to at most one image filename.

---

## Derived URL pattern (unchanged)

Exercise images are served as static assets under the `/exercises/` path:

```ts
const imageUrl = imageFilename
  ? `${import.meta.env.BASE_URL}exercises/${imageFilename}`
  : null;
```

This pattern is already used in `ExerciseList/index.tsx` and is not changed by this feature.

---

## No schema migrations required

The `exercise` table already has `image_filename` (added in feature 013). No `drizzle-kit generate` step is needed.
