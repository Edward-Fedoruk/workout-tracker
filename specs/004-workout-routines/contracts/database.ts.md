# Contract: `database.ts` — Routine Helpers

New exports added to `src/database.ts` for the Workout Routines feature. All helpers follow the established pattern: call `initDatabase()`, then use the shared `database` Drizzle instance or `getPromiser()` / `getDatabaseId()` for raw SQL.

---

## Types

```ts
export type Routine = typeof routine.$inferSelect;
export type RoutineExercise = typeof routineExercise.$inferSelect;
export type RoutineWithExercises = Routine & { exercises: RoutineExercise[] };

export type LastExerciseSets = Array<{ setNumber: number; weight: number; reps: number }>;
```

---

## `listRoutines(): Promise<RoutineWithExercises[]>`

Returns all routines ordered by `created_at ASC`, each with their exercises ordered by `position ASC`.

**Implementation note**: Two queries — fetch all routines, then fetch all exercises ordered by `(routine_id, position)` and group in JS. Avoids an N+1 pattern.

---

## `getRoutineById(id: number): Promise<RoutineWithExercises | null>`

Returns a single routine with its exercises, or `null` if not found.

---

## `createRoutine(name: string): Promise<number>`

Inserts a new routine. Returns the new `id`.

**Validation** (caller responsibility): `name` must be non-empty and ≤ 100 chars. The DB `CHECK` constraint is a safety net, not a substitute for UI validation.

---

## `updateRoutine(id: number, name: string): Promise<void>`

Updates the routine name and sets `updated_at = CURRENT_TIMESTAMP`.

---

## `deleteRoutine(id: number): Promise<void>`

Deletes the routine. Cascade in the DB removes all associated `routine_exercise` rows automatically.

---

## `addRoutineExercise(routineId: number, exerciseName: string, suggestedSets: number, suggestedReps: number): Promise<number>`

Appends an exercise to the end of the routine (position = current max + 1). Returns the new exercise `id`.

---

## `updateRoutineExercise(id: number, exerciseName: string, suggestedSets: number, suggestedReps: number): Promise<void>`

Updates the name, sets, and reps of an existing exercise. Does not change its position.

---

## `deleteRoutineExercise(id: number, routineId: number): Promise<void>`

Deletes the exercise and re-indexes the remaining exercises for the same `routineId` so positions remain dense (1, 2, 3 …).

**Implementation**: Run inside a single transaction using `BEGIN` / `COMMIT` via raw promiser to keep the re-index atomic.

---

## `moveRoutineExercise(id: number, routineId: number, direction: 'up' | 'down'): Promise<void>`

Swaps the `position` of the target exercise with its immediate neighbour (above for `'up'`, below for `'down'`). No-ops silently if the exercise is already at the boundary.

**Implementation**: Two UPDATE statements inside a `BEGIN` / `COMMIT` transaction.

---

## `getLastExerciseSets(exerciseName: string, setCount: number): Promise<LastExerciseSets>`

Returns up to `setCount` set records (weight + reps, by set_number) from the most recent `workout_log` entry whose `exercise_name` matches `exerciseName` (case-insensitive). Returns an empty array if no prior entry exists.

**Raw SQL** (not expressible via Drizzle join + limit on a sub-select):
```sql
SELECT s.set_number, s.weight, s.reps
FROM workout_log w
JOIN workout_set s ON s.workout_id = w.id
WHERE LOWER(w.exercise_name) = LOWER(?)
  AND w.id = (
    SELECT id FROM workout_log
    WHERE LOWER(exercise_name) = LOWER(?)
    ORDER BY workout_date DESC, id DESC
    LIMIT 1
  )
ORDER BY s.set_number ASC
LIMIT ?
```

**Bind**: `[exerciseName, exerciseName, setCount]`

---

## FR traceability

| FR | Helper |
|----|--------|
| FR-002 | `createRoutine` |
| FR-003 | `updateRoutine` |
| FR-004 | `deleteRoutine` |
| FR-006 | `addRoutineExercise` |
| FR-007 | `updateRoutineExercise` |
| FR-008 | `deleteRoutineExercise` |
| FR-009 | `moveRoutineExercise` |
| FR-011 | `getRoutineById` |
| FR-012 | `getLastExerciseSets` (pre-fill) |
| FR-013 | `createWorkout` (existing) |
