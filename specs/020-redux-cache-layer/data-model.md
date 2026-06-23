# Phase 1 Data Model: Redux Cache Layer

No persisted entities change. The domain entities (Exercise, MuscleGroup, Routine, RoutineExercise,
WorkoutLog, RoutineWorkoutDraft, AppSettings) keep their existing shapes and TypeScript types exported from
`@/database`. This document models the **in-memory cache state** the store maintains over them.

## Cache state (RTK Query managed, in-memory only)

The store holds a single `api` reducer slice. RTK Query maintains, per endpoint+arg ("cache key"), an entry:

| Field | Meaning | Maps to spec |
|-------|---------|--------------|
| `data` | The last successfully loaded value (entity list / object). `undefined` until first load; `[]` for a legitimately empty set. | FR-001, FR-002; empty-vs-not-loaded distinction (FR-012) |
| `status` | `uninitialized` → `pending` → `fulfilled` / `rejected` | FR-012 (not loaded / loading / loaded / failed) |
| `error` | Error message string when `status = rejected` | FR-007, FR-012 |
| `fulfilledTimeStamp` | When the data was last loaded (drives `keepUnusedDataFor`) | SC-004 (load once per session) |
| `subscribers` | Active component subscriptions; when zero, entry is kept for `keepUnusedDataFor` then evicted | SC-001 (instant revisit), SC-004 |

The UI never reads these fields directly — it consumes them through generated hooks as
`{ data, isLoading, isFetching, isError, error }` (see `contracts/ui-hooks.md`).

**Invariant (FR-008/FR-009)**: every value in the cache originated from a `@/database` read or was just
written through a `@/database` write. The cache is never serialized to disk, never the durable store.

## Cache keys (endpoints) and tags

Each endpoint is a cache key; tags wire mutations to the queries (and analytics) they must invalidate.

| Data set | Query endpoint(s) | Mutation endpoint(s) | Tag(s) provided / invalidated |
|----------|-------------------|----------------------|-------------------------------|
| Exercises | `listExercises()`, `getExercise(id)` | `createExercise`, `updateExercise`, `deleteExercise` | `Exercise` |
| Muscle groups | `listMuscleGroups()` | `createMuscleGroup`, `updateMuscleGroup`, `deleteMuscleGroup` | `MuscleGroup`; also invalidate `Exercise` (exercises display group data) |
| Routines | `listRoutines()`, `getRoutine(id)` | `createRoutine`, `updateRoutine`, `deleteRoutine` | `Routine` |
| Routine exercises | (loaded via routine queries) | `addRoutineExercise`, `updateRoutineExercise`, `deleteRoutineExercise`, `moveRoutineExercise`, `reorderRoutineExercises`, `setRoutineExerciseSetCount` | `Routine` (a routine's exercise list is part of the routine) |
| Workouts | `listWorkouts()`, `listWorkoutsByExerciseName(name)`, `getWorkout(id)` | `createWorkout`, `updateWorkout`, `deleteWorkout` | `Workout` |
| Active draft | `getDraft()` | `saveDraft`, `clearDraft` | `Draft` |
| Settings | `getBodyWeight()`, `getExerciseNamesInTables()` | `setBodyWeight`, `setExerciseNamesInTables` | `Settings` |
| Analytics (read-only) | `listSetRowsInRange(start,end)`, `listMuscleGroupSetRowsInRange(start,end)` | — | provides `Workout` (re-reads when any workout changes → FR-013) |

Notes:
- **Routine exercises have no independent query** — they are nested in `RoutineWithExercises`, so their
  mutations invalidate the `Routine` tag and the routine re-reads. This keeps the cache consistent without a
  separate cache key.
- **Analytics endpoints provide the `Workout` tag** (and `Exercise`/`MuscleGroup` where their math depends on
  those) so any logging edit invalidates them, satisfying FR-013 with no bespoke wiring.
- **Body weight affects derived eRM** shown in workouts/analytics; `setBodyWeight` additionally invalidates
  `Workout` so dependent views recompute.

## State transitions (per cache key)

```text
uninitialized ──first subscribe──► pending ──helper resolves──► fulfilled(data)
                                       └────── helper throws ──► rejected(error)

fulfilled ──invalidatesTags fires (a write)──► pending(refetch) ──► fulfilled(new data)   // read-your-writes
fulfilled ──last subscriber unmounts──► (kept keepUnusedDataFor) ──timeout──► evicted (→ uninitialized)
any state ──location.reload() on DB import──► store destroyed (FR-010)
```

Write-through (FR-004/FR-007): a mutation runs `pending → fulfilled/rejected` on the **mutation**; only on
`fulfilled` does `invalidatesTags` fire and refresh the affected **query** keys. On `rejected`, no
invalidation occurs, so query caches stay equal to durable storage (SC-006).

## Validation rules

No new validation. Existing rules stay where they are:
- Duplicate-name checks (e.g. exercises) remain in the container hook against the cached list before
  dispatching the create mutation — same logic as today, now reading `data` from the query hook.
- SQLite constraints and repository-level validation are unchanged and remain the durable enforcement point.
