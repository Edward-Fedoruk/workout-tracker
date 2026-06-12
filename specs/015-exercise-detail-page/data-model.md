# Data Model: Exercise Detail Page

## No schema changes

This feature requires no DDL changes. All data is already present in the existing schema.

---

## Existing entities (relevant to this feature)

### `exercise`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Route param for `/exercises/:id` |
| `name` | TEXT NOT NULL | Join key to `workout_log.exercise_name` |
| `classification` | TEXT | `'standard'` or `'bodyweight'` |
| `image_filename` | TEXT NULL | Resolved via `BASE_URL/exercises/<filename>` |
| `created_at` | TEXT | ISO timestamp |

Related: `exercise_muscle_group` join table → `muscle_group` rows.

### `workout_log`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `workout_date` | TEXT | ISO date string `YYYY-MM-DD` |
| `exercise_name` | TEXT NOT NULL | Denormalized; matches `exercise.name` |
| `updated_at` | TEXT | |

Related: `workout_set` rows keyed by `workout_id`.

---

## New read operations (no schema change)

### `exerciseRepository.getById(id: number): Promise<Exercise | null>`

Fetches a single exercise with its muscle groups. Returns `null` if not found.

```sql
SELECT id, name, classification, image_filename, created_at
FROM exercise
WHERE id = ?
```

Then fetches muscle groups with the same join query already used by `list()`, filtered to the single `exercise_id`.

### `workoutLogRepository.listByExerciseName(exerciseName: string): Promise<WorkoutTableRow[]>`

Returns the same pivoted `WorkoutTableRow` shape as `list()`, filtered to a single exercise name, ordered newest-first.

```sql
SELECT
  w.id, w.workout_date, w.exercise_name,
  MAX(CASE WHEN s.set_number = 1 THEN s.weight END) AS Set1_weight,
  ...
FROM workout_log w
LEFT JOIN workout_set s ON s.workout_id = w.id
WHERE w.exercise_name = ?
GROUP BY w.id, w.workout_date, w.exercise_name
ORDER BY w.workout_date DESC, w.id DESC
```

---

## Type additions to `database.ts`

```ts
export const getExerciseById = (id: number) => exerciseRepository.getById(id);
export const listWorkoutsByExerciseName = (exerciseName: string) =>
  workoutLogRepository.listByExerciseName(exerciseName);
```

Both follow the existing pattern: thin exports in `database.ts`, implementation in the entity repository.
