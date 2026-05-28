# Contract: src/db/routineHelpers.ts (rep range changes)

Only the changed/added signatures are listed. Unchanged exports are omitted.

---

## Changed: `addRoutineExercise`

```ts
export async function addRoutineExercise(
  routineId: number,
  exerciseName: string,
  suggestedSets: number,
  minReps: number,
  maxReps: number,
): Promise<number>
```

**Change**: `suggestedReps: number` parameter replaced by `minReps: number, maxReps: number`.  
**Behaviour**: Inserts a new `routine_exercise` row with the given `min_reps` and `max_reps`. Returns the new row's `id`.

---

## Changed: `updateRoutineExercise`

```ts
export async function updateRoutineExercise(
  id: number,
  exerciseName: string,
  suggestedSets: number,
  minReps: number,
  maxReps: number,
): Promise<void>
```

**Change**: `suggestedReps: number` parameter replaced by `minReps: number, maxReps: number`.  
**Behaviour**: Updates the matching `routine_exercise` row in place. No return value.

---

## Unchanged (listed for completeness)

- `listRoutines(): Promise<RoutineWithExercises[]>`
- `getRoutineById(id: number): Promise<RoutineWithExercises | null>`
- `createRoutine(name: string): Promise<number>`
- `updateRoutine(id: number, name: string): Promise<void>`
- `deleteRoutine(id: number): Promise<void>`
- `deleteRoutineExercise(id: number, routineId: number): Promise<void>`
- `moveRoutineExercise(id: number, routineId: number, direction: 'up' | 'down'): Promise<void>`
- `getLastExerciseSets(exerciseName: string, setCount: number): Promise<LastExerciseSets>`

---

## Changed: `RoutineExercise` type (auto-inferred)

The `RoutineExercise` type is `typeof routineExercise.$inferSelect`. After the schema change:

```ts
type RoutineExercise = {
  id: number;
  routineId: number;
  exerciseName: string;
  position: number;
  suggestedSets: number;
  minReps: number;   // replaces suggestedReps
  maxReps: number;   // replaces suggestedReps
  // suggestedReps is gone
}
```

---

## New utility: `formatRepRange` (in `routineUtilities.ts`)

```ts
export function formatRepRange(minReps: number, maxReps: number): string
```

Returns `"X–Y reps"` when `minReps !== maxReps`, or `"X reps"` when equal.  
Used by `ExerciseRow`, `RoutineWorkoutExercise`, and any other display surface.

---

## Changed: `validateExercise` (in `routineUtilities.ts`)

```ts
export function validateExercise(
  name: string,
  sets: number,
  minReps: number,
  maxReps: number,
): { name?: string; minReps?: string; maxReps?: string; sets?: string }
```

**Change**: `reps: number` parameter split into `minReps` and `maxReps`; error keys updated accordingly.  
**Additional validation rule**: if `minReps > maxReps`, set `maxReps` error to `"Max reps must be ≥ min reps"`.
