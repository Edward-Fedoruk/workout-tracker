# Research: Persisted eRM & Optional Weight Entry

**Feature**: 008-bodyweight-erm-weight  
**Date**: 2026-05-31

## Codebase Findings

### Current eRM computation (on-the-fly)

`WorkoutSetRow.tsx` computes eRM at render time via `computeSetERM` → `accessorFn`. It reads `Set1_weight` / `Set1_reps` from `WorkoutTableRow` and calls `computeEffectiveWeight` + `computeERM` from `src/utils/erm.ts`. Body weight and classification are passed in from `WorkoutTable` state. No eRM is stored anywhere.

### workout_set schema (current)

```sql
workout_set(
  id       INTEGER PRIMARY KEY,
  reps     INTEGER NOT NULL,         -- CHECK reps > 0
  set_number INTEGER NOT NULL,       -- CHECK BETWEEN 1 AND 5
  weight   REAL NOT NULL,            -- no positive check (removed in 0005)
  workout_id INTEGER NOT NULL REFERENCES workout_log(id) ON DELETE CASCADE
)
```

Weight is NOT NULL but has no positive check (that was removed in migration 0005 to support assisted/negative weights). Making weight nullable requires a table rebuild (SQLite limitation).

### Weight validation (current, workoutFormUtilities.ts)

- `standard`: rejects empty or ≤ 0
- `bodyweight`: accepts 0 but rejects empty string — **this is the gap**
- `assisted`: rejects empty string — **this is the gap**

Neither path checks whether body weight is set; the body weight guard is only on eRM display (shows `—`).

### WorkoutForm.tsx does NOT load body weight

It loads the exercise list for classification lookup, but never fetches body weight. Must be added.

### RoutineWorkoutForm.tsx filter drops 0-weight sets

```ts
const filledSets = sets
  .filter((setEntry) => setEntry.weight !== '' && setEntry.reps !== '')
  .map(...)
  .filter((setEntry) => setEntry.weight > 0 && setEntry.reps > 0);
```

The second filter (`weight > 0`) silently drops any BW/assisted set where the user leaves weight blank or enters 0. This is the main bug for the routine path.

### routine_exercise has NO weight field

The `routine_exercise` table stores `suggestedSets`, `minReps`, `maxReps`, and `position` but no `suggestedWeight`. The spec's FR-011 ("routine entries accept empty/0 weight") refers to the workout-execution form (`RoutineWorkoutExercise`), not a stored template value. No new schema column is needed for `routine_exercise`; the fix is in the runtime filter only.

### getLastExerciseSets returns weight: number

Returns the most recent logged weights as numeric. After making `workout_set.weight` nullable, this helper must handle null weights (exclude null-weight sets from prefill or coerce to 0).

### WorkoutTableRow and listWorkouts

The pivot query returns `Set1_weight` through `Set5_weight` and `Set1_reps` through `Set5_reps` but no eRM columns. After this feature, it must also return `Set1_erm` through `Set5_erm` from the stored column.

### Next migration number

Latest migration: `0005_erm_bodyweight.sql`. Next available: `0006`.

---

## Decisions

### D1 — Make workout_set.weight nullable

- **Decision**: Remove `NOT NULL` from `workout_set.weight`. Empty field input stores `null`; explicit `0` stores `0`.
- **Rationale**: Storing `null` vs `0` distinguishes "no added weight (body weight only)" from "user typed zero". Displaying `null` as `—` is honest; displaying `0` as "0 kg" is misleading for BW exercises. The distinction also enables correct handling in `getLastExerciseSets` (skip null-weight sets from prefill since they have no numeric meaning as a weight suggestion).
- **Implementation cost**: Requires rebuilding `workout_set` in the migration. Migration 0005 already does this as a pattern; it is not novel.
- **Alternative rejected**: Store 0 for empty fields. Rejected because display would show "0 kg" for every unweighted BW set, confusing users.

### D2 — Add workout_set.erm nullable real column

- **Decision**: Add `erm REAL` (nullable, no default) to `workout_set` via `ALTER TABLE ... ADD COLUMN`. Existing rows get `NULL` by default — no backfill.
- **Rationale**: `ALTER TABLE ... ADD COLUMN` for nullable columns is safe in SQLite and does not require a table rebuild.
- **Null semantics**: `null` means either (a) body weight was absent, (b) effective weight ≤ 0, or (c) the set was logged before this feature shipped (pre-existing row).

### D3 — eRM computed in the form layer, passed as a field to DB helpers

- **Decision**: `createWorkout` and `updateWorkout` accept `erm: null | number` per set. The calling form (WorkoutForm, RoutineWorkoutForm) computes eRM using the existing `computeEffectiveWeight` + `computeERM` utilities before saving.
- **Rationale**: DB helpers become pure storage — they do not need to know about body weight or classification. The form layer already has both (it loads exercises for classification; body weight is loaded for validation). Keeping the computation in the form avoids an extra DB roundtrip inside the helper and keeps helpers testable in isolation.
- **Alternative rejected**: Fetch body weight + classification inside `createWorkout`/`updateWorkout`. Rejected because it couples storage helpers to business logic and adds a hidden async dependency.

### D4 — validateWorkoutForm accepts bodyWeight parameter

- **Decision**: Add `bodyWeight: null | number` to the `validateWorkoutForm` parameter object. When `classification` is `bodyweight` or `assisted` AND the weight field is empty/0 AND `bodyWeight` is `null`, return a per-set error: "Body weight not set — add it in Settings."
- **Rationale**: Validation must be synchronous and pure; passing body weight in avoids an async call inside validation.

### D5 — WorkoutSetRow reads stored eRM, no longer computes it

- **Decision**: `WorkoutTableRow` gains `Set1_erm` through `Set5_erm` (nullable number). `listWorkouts` pivot query adds eRM to each column group. `WorkoutSetRow.tsx` drops `computeSetERM` and reads the stored field directly via `accessorKey`.
- **Rationale**: Stored eRM is the source of truth per spec (historical values must not change when body weight changes). Computing from current body weight at render time would violate that invariant.
- **Edge case**: Pre-existing sets have `null` eRM — displayed as `—`, same as before.

### D6 — RoutineWorkoutForm filter fixed; no schema change to routine_exercise

- **Decision**: Remove the `weight > 0` guard in `RoutineWorkoutForm.handleSubmit`. A set is included if it has reps > 0; weight may be null/0 for BW/assisted exercises. The form must also know each exercise's classification to pass weight as null and compute eRM correctly.
- **Rationale**: `routine_exercise` currently has no weight column. FR-011 is fully satisfied by fixing the runtime filter and allowing null/0 weight through to `createWorkout`. No schema change needed.
