# Data Model: Routine Inline Editing & UI Consistency

**No schema migration is required.** This feature changes where/how existing data is edited, not its
shape. All tables and constraints below already exist (`drizzle/0000_past_callisto.sql`,
`0002_routine-workout-draft.sql`). Listed here for the invariants the UI and new helpers must uphold.

## Entities (existing)

### `routine`
- `id` (PK), `name` (TEXT, ≤100 chars), `created_at`, `updated_at`.
- **Edited inline**: `name` via rename (`updateRoutine`). Created via `createRoutine` from the list `+`.

### `routine_exercise`
- `id` (PK), `exercise_name` (TEXT), `min_reps` (1–99), `max_reps` (1–99), `suggested_sets` (1–5),
  `position` (≥1), `routine_id` (FK → `routine`, ON DELETE CASCADE).
- **Unique**: `(routine_id, position)` — positions MUST stay contiguous `1..N` with no gaps/dupes.
- **Edited inline**:
  - add exercise → `addRoutineExercise` (appends at `MAX(position)+1`).
  - delete exercise → `deleteRoutineExercise` (re-densifies positions; confirm required).
  - add/remove set → `setRoutineExerciseSetCount` adjusts `suggested_sets` within **1–5**.
  - edit rep range → `updateRoutineExercise` (min/max within **1–99**, `min ≤ max` per form schema).
  - reorder → `reorderRoutineExercises` (rewrites `position` to match a given id order).

### `routine_workout_draft` (singleton, `id = 1`)
- `draft_data` (JSON TEXT), `routine_id` (FK → `routine`, ON DELETE CASCADE), `updated_at`.
- `draft_data` shape: `Record<routineExerciseId(string), Array<{ weight: number|null; reps: number|null; completed?: boolean }>>`.
- **Role**: holds entered set values + completion. Keyed by `routineExerciseId`, so it survives reorder
  and set-count changes. Rewritten wholesale on each `saveDraft` (stale removed-exercise keys drop out).

### `workout_log` / `workout_set` (unchanged)
- On submit, filled sets are written via `createWorkout` exactly as today; `completed` is not persisted to
  the log (it remains draft-only). Set ordering = `set_number` (1–5).

## Invariants the implementation must preserve

1. `suggested_sets` ∈ [1, 5]; add-set disabled at 5, remove-set disabled at 1 (UI **and** helper guard).
2. `min_reps`, `max_reps` ∈ [1, 99]; `min_reps ≤ max_reps` (enforced by `RoutineExerciseForm.schema`).
3. `routine_exercise.position` is always contiguous `1..N` per routine after any add/delete/reorder.
4. Draft keys reference live `routine_exercise.id`s; the merged form is a pure projection of
   (routine structure + draft + last-time prefills).
5. All writes go through `database.ts` helpers using parameterized SQL (Principles I, IV).

## State transitions

- **Exercise card completion**: derived (not stored) — `allCompleted = sets.every(s => s.completed)` from
  watched form values → card turns green; reverts when any set is un-completed.
- **Routine lifecycle**: create (default name) → edit inline → log workout (submit clears draft) or leave
  (draft persists, "In Progress" chip on the list). Delete routine cascades exercises + draft.
