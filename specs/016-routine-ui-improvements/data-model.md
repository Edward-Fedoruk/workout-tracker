# Data Model: Routine UI Improvements

## No schema migrations required

All changes are additive to existing in-memory TypeScript types or the freeform JSON draft column. No Drizzle schema file changes and no `drizzle-kit generate` run are needed.

---

## Modified Type: StoredSetValues

**File**: `src/db/entities/routine-workout-draft/types.ts`

```
Before:
  StoredSetValues = Array<{ reps: null | number; weight: null | number }>

After:
  StoredSetValues = Array<{ completed?: boolean; reps: null | number; weight: null | number }>
```

- `completed` is optional (`?`) so existing draft rows without the field deserialise gracefully (treated as `false` at read time).
- No DB migration required — `draft_data` is a JSON text column; the change is purely in the TypeScript type and the serialisation/deserialisation code.

---

## Modified Type: LastExerciseSets (read-only, no storage change)

**File**: `src/db/entities/routine-exercise/types.ts`

No type change needed. The shape stays `Array<{ reps: number; setNumber: number; weight: null | number }>`.

The change is in **behaviour**: `getLastSets` gains a fallback pass — for each set position where `weight` and `reps` are both null in the most recent workout, a second query fetches the most recent non-null value at that position from any earlier workout.

---

## New prop: imageFilename on RoutineWorkoutExercise

**Not a stored entity change** — this is a prop threading concern.

`RoutineWorkoutExercise` receives a new optional prop `imageFilename?: string`. The hook (`useRoutineWorkout`) already has the full `Exercise[]` library list; it builds a lookup map `exerciseImageMap: Map<string, string>` (exercise name → imageFilename) and passes the resolved value per exercise when constructing the exercise list for the view.

---

## Entities unchanged

| Entity | Change |
|--------|--------|
| `routine` | None |
| `routine_exercise` | None |
| `routine_workout_draft` | JSON column gains `completed` field in TS type only |
| `workout_log` | None |
| `workout_set` | None |
| `exercise` | None |

---

## State transitions: set completion

```
Set row state machine:
  unchecked  ──[tap checkbox]──►  checked (green highlight)
  checked    ──[tap checkbox]──►  unchecked (no highlight)

Draft persistence: on every checkbox change, autoSave() is called, same as weight/reps blur.

Log Workout button:
  disabled  when  any set in any exercise has completed !== true
  enabled   when  all sets in all exercises have completed === true
```
