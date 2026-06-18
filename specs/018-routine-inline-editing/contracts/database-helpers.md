# Contract: Database helpers (`src/database.ts`)

All UI accesses these through `@/database`. New/changed helpers below; existing ones reused unchanged
(`createRoutine`, `updateRoutine`, `deleteRoutine`, `getRoutineById`, `listRoutines`,
`addRoutineExercise`, `updateRoutineExercise`, `deleteRoutineExercise`, `getLastExerciseSets`,
`saveDraft`, `getDraft`, `clearDraft`, `createWorkout`).

## NEW: `reorderRoutineExercises`

```ts
export const reorderRoutineExercises = (
  routineId: number,
  orderedIds: number[],
) => routineExerciseRepository.reorder(routineId, orderedIds);
```

- `orderedIds`: the routine's `routine_exercise.id`s in the desired top-to-bottom order (length MUST
  equal the routine's exercise count).
- Effect: sets each id's `position` to its index+1 in `orderedIds`.
- Implementation: single `BEGIN/COMMIT`; pass 1 `UPDATE ... SET position = -(idx+1) WHERE id = ?` per id;
  pass 2 `UPDATE routine_exercise SET position = -position WHERE routine_id = ? AND position < 0`.
  Parameterized (`?`) only. Rolls back on error.
- Postcondition: positions contiguous `1..N`, matching `orderedIds`.

## NEW: `setRoutineExerciseSetCount`

```ts
export const setRoutineExerciseSetCount = (
  id: number,
  suggestedSets: number,
) => routineExerciseRepository.updateSetCount(id, suggestedSets);
```

- Guards `1 ≤ suggestedSets ≤ 5` (throws/clamps; UI also disables at bounds).
- Effect: `UPDATE routine_exercise SET suggested_sets = ? WHERE id = ?` via Drizzle.
- Used by the add-set / remove-set buttons (current count ± 1).

## Repository additions (`src/db/entities/routine-exercise/repository.ts`)

```ts
async reorder(routineId: number, orderedIds: number[]): Promise<void>
async updateSetCount(id: number, suggestedSets: number): Promise<void>
```

- `reorder` follows the existing `move`/`delete` transaction style (`getPromiser()`, `getDatabaseId()`,
  `BEGIN`/`COMMIT`/`ROLLBACK`, bind arrays).
- `updateSetCount` uses the Drizzle `database.update(routineExercise).set({ suggestedSets }).where(eq(...))`
  pattern like the existing `update`.
