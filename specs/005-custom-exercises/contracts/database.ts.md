# Contract: `src/db/exerciseHelpers.ts`

All exercise and muscle group DB operations live in this new helper file, following the existing pattern in `src/db/routineHelpers.ts`. UI components import from `src/database.ts` (the public re-export barrel), not directly from this file.

---

## Types

```ts
export type Exercise = {
  id: number;
  name: string;
  createdAt: string;
  muscleGroups: MuscleGroup[];   // always populated (joined on fetch)
};

export type MuscleGroup = {
  id: number;
  name: string;
};
```

---

## Exercise helpers

### `listExercises(): Promise<Exercise[]>`

Returns all exercises ordered alphabetically by name, each with their full `muscleGroups` array populated.

**Reads**: `exercise` LEFT JOIN `exercise_muscle_group` JOIN `muscle_group`

---

### `createExercise(name: string, muscleGroupIds: number[]): Promise<number>`

Inserts a new exercise and its muscle group assignments. Returns the new exercise `id`.

**Preconditions (caller must validate)**:
- `name.trim()` is 1–100 chars
- No existing exercise with the same name (case-insensitive)
- `muscleGroupIds.length >= 1`

**Writes**: `exercise` INSERT + `exercise_muscle_group` INSERT (multiple rows, inside BEGIN/COMMIT)

**Throws** if insert fails.

---

### `updateExercise(id: number, name: string, muscleGroupIds: number[]): Promise<void>`

Renames the exercise and replaces its muscle group assignments. Propagates the new name to all referencing `workout_log` and `routine_exercise` rows in the same transaction.

**Preconditions (caller must validate)**:
- `name.trim()` is 1–100 chars
- No *other* exercise with the same name (case-insensitive)
- `muscleGroupIds.length >= 1`

**Writes (single transaction)**:
1. `UPDATE exercise SET name = ? WHERE id = ?`
2. `UPDATE workout_log SET exercise_name = ? WHERE exercise_name = ?` (old name → new name)
3. `UPDATE routine_exercise SET exercise_name = ? WHERE exercise_name = ?`
4. `DELETE FROM exercise_muscle_group WHERE exercise_id = ?`
5. `INSERT INTO exercise_muscle_group ...` (new assignments)

---

### `deleteExercise(id: number): Promise<void>`

Deletes the exercise and clears all routine slots that reference it. Workout log rows are not modified.

**Writes (single transaction)**:
1. Fetch `name` for the given `id`
2. `DELETE FROM routine_exercise WHERE exercise_name = ?`
3. `DELETE FROM exercise WHERE id = ?` (cascade removes `exercise_muscle_group` rows)

---

## Muscle group helpers

### `listMuscleGroups(): Promise<MuscleGroup[]>`

Returns all muscle groups ordered alphabetically by name.

---

### `createMuscleGroup(name: string): Promise<number>`

Inserts a new muscle group. Returns the new `id`.

**Preconditions**: name 1–50 chars, non-empty after trim, case-insensitively unique.

---

### `updateMuscleGroup(id: number, name: string): Promise<void>`

Renames a muscle group. The join table rows are unaffected (they reference by `id`); the new name is reflected everywhere automatically.

**Preconditions**: same as `createMuscleGroup`.

---

### `deleteMuscleGroup(id: number): Promise<void>`

Deletes a muscle group. `exercise_muscle_group` rows referencing it are removed via cascade. Exercises are not deleted.

---

## Public re-exports (`src/database.ts`)

The following symbols must be added to the existing re-export barrel so UI components never import directly from `src/db/exerciseHelpers.ts`:

```ts
export {
  createExercise,
  createMuscleGroup,
  deleteExercise,
  deleteMuscleGroup,
  listExercises,
  listMuscleGroups,
  type Exercise,
  type MuscleGroup,
  updateExercise,
  updateMuscleGroup,
} from './db/exerciseHelpers';
```
