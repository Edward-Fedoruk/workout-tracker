# Contract: Store API (RTK Query endpoints)

The store exposes one `api` (`createApi`) whose endpoints wrap `@/database` helpers. This contract fixes the
endpoint surface, their tags, and the invariants every endpoint must uphold. Entities inject their endpoints
into the single `api` via `api.injectEndpoints`.

## Global configuration (`src/store/api.ts`)

```ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<string>(),     // error channel carries a user-facing message string
  tagTypes: ['Exercise', 'MuscleGroup', 'Routine', 'Workout', 'Draft', 'Settings'],
  keepUnusedDataFor: 3600,                // session-length retention (R3 / SC-004)
  refetchOnMountOrArgChange: false,       // instant revisits (SC-001)
  endpoints: () => ({}),
});
```

**Invariants (apply to every endpoint):**
- INV-1: A `queryFn` / mutation MUST call only `@/database` helpers. It MUST NOT import
  `@sqlite.org/sqlite-wasm`, the `promiser`, `dbId`, or any repository directly (Constitution II).
- INV-2: A `queryFn` MUST return `{ data }` on success and `{ error: <message> }` on a thrown helper error —
  never throw out of the endpoint (so RTK Query records `rejected`, FR-012).
- INV-3: Query endpoints are read-only and MUST declare `providesTags`. Mutation endpoints MUST declare
  `invalidatesTags` and MUST NOT update the cache on failure (FR-007).
- INV-4: Result and argument types MUST be derived from the wrapped `@/database` helper signatures — no
  `any`/`unknown` casts (Constitution IX).

## Query endpoints

| Endpoint | Arg | Returns | `providesTags` |
|----------|-----|---------|----------------|
| `listExercises` | `void` | `Exercise[]` | `['Exercise']` |
| `getExercise` | `id: number` | `Exercise \| undefined` | `[{ type: 'Exercise', id }]` |
| `listMuscleGroups` | `void` | `MuscleGroup[]` | `['MuscleGroup']` |
| `listRoutines` | `void` | `RoutineWithExercises[]` | `['Routine']` |
| `getRoutine` | `id: number` | `RoutineWithExercises \| undefined` | `[{ type: 'Routine', id }]` |
| `listWorkouts` | `void` | `WorkoutTableRow[]` | `['Workout']` |
| `listWorkoutsByExerciseName` | `name: string` | `WorkoutWithSets[]` | `['Workout']` |
| `getWorkout` | `id: number` | `WorkoutWithSets \| null` | `[{ type: 'Workout', id }]` |
| `getDraft` | `void` | `RoutineWorkoutDraft \| null` | `['Draft']` |
| `getBodyWeight` | `void` | `number \| null` | `['Settings']` |
| `getExerciseNamesInTables` | `void` | `boolean` | `['Settings']` |
| `listSetRowsInRange` | `{ startIso, endIso }` | `AnalyticsSetRow[]` | `['Workout', 'Exercise', 'Settings']` |
| `listMuscleGroupSetRowsInRange` | `{ startIso, endIso }` | `AnalyticsMuscleGroupSetRow[]` | `['Workout', 'MuscleGroup']` |

## Mutation endpoints

| Endpoint | Arg | Wraps | `invalidatesTags` |
|----------|-----|-------|-------------------|
| `createExercise` | `{ name, muscleGroupIds, classification, imageFilename? }` | `createExercise` | `['Exercise']` |
| `updateExercise` | `{ id, ... }` | `updateExercise` | `['Exercise', 'Workout']` (names shown in workouts) |
| `deleteExercise` | `id` | `deleteExercise` | `['Exercise']` |
| `createMuscleGroup` | `{ name, color }` | `createMuscleGroup` | `['MuscleGroup', 'Exercise']` |
| `updateMuscleGroup` | `{ id, name, color }` | `updateMuscleGroup` | `['MuscleGroup', 'Exercise']` |
| `deleteMuscleGroup` | `id` | `deleteMuscleGroup` | `['MuscleGroup', 'Exercise']` |
| `createRoutine` | `name` | `createRoutine` | `['Routine']` |
| `updateRoutine` | `{ id, name }` | `updateRoutine` | `['Routine']` |
| `deleteRoutine` | `id` | `deleteRoutine` | `['Routine']` |
| `addRoutineExercise` | `{ routineId, ... }` | `addRoutineExercise` | `['Routine']` |
| `updateRoutineExercise` | `{ id, ... }` | `updateRoutineExercise` | `['Routine']` |
| `deleteRoutineExercise` | `{ id, routineId }` | `deleteRoutineExercise` | `['Routine']` |
| `moveRoutineExercise` | `{ id, routineId, direction }` | `moveRoutineExercise` | `['Routine']` |
| `reorderRoutineExercises` | `{ routineId, orderedIds }` | `reorderRoutineExercises` | `['Routine']` |
| `setRoutineExerciseSetCount` | `{ id, suggestedSets }` | `setRoutineExerciseSetCount` | `['Routine']` |
| `createWorkout` | `{ workoutDate, exerciseName, sets }` | `createWorkout` | `['Workout']` |
| `updateWorkout` | `{ id, workoutDate, exerciseName, sets }` | `updateWorkout` | `['Workout']` |
| `deleteWorkout` | `id` | `deleteWorkout` | `['Workout']` |
| `saveDraft` | `{ routineId, data }` | `saveDraft` | `['Draft']` |
| `clearDraft` | `void` | `clearDraft` | `['Draft']` |
| `setBodyWeight` | `kg` | `setBodyWeight` | `['Settings', 'Workout']` (eRM depends on body weight) |
| `setExerciseNamesInTables` | `enabled` | `setExerciseNamesInTables` | `['Settings']` |

## Read helper exceptions (not endpoints)

`getLastExerciseSets(name, count)` is an on-demand lookup used inside a workflow (prefilling a routine
workout), not a view-backing list. It MAY stay a direct `@/database` call inside the container hook; caching
it adds no revisit value. Document it as intentionally out of the cache.

## Acceptance checks for this contract

- AC-1: Loading any list page twice issues at most one underlying `@/database` read for that list within the
  session (SC-004) — verify via a temporary log in the wrapped helper or Redux DevTools (one `pending`).
- AC-2: A mutation that throws produces a `rejected` mutation result, no tag invalidation, and the
  corresponding query cache is byte-identical to before (SC-006).
- AC-3: Editing a workout updates the workouts list **and** any open analytics view without a manual refresh
  (FR-013), because both provide `Workout`.
