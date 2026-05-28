# Tasks: Rep Range for Routine Exercises

**Input**: Design documents from `specs/006-reps-range/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story. Foundational phase covers the schema change and all TypeScript compile fixes at the data layer; user story phases cover the UI behavior and display for each spec priority.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

*No project initialization needed — project structure is already in place.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Replace `suggested_reps` with `min_reps`/`max_reps` at the schema and data-layer level. Changing `schema.ts` (T001) will cause TypeScript errors in all callers; T002–T005 resolve those errors. The codebase will not compile between T001 and the end of Phase 3–5 (each user story phase fixes the remaining UI callsites).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Update `src/db/schema.ts`: remove `suggestedReps` column and its check constraint; add `minReps: integer('min_reps').notNull()` and `maxReps: integer('max_reps').notNull()` with `min_reps_check` and `max_reps_check` constraints (each BETWEEN 1 AND 99)
- [X] T002 Run `npx drizzle-kit generate` from repo root to produce a new migration file in `drizzle/` — NOTE: drizzle-kit requires TTY/interactive input which is unavailable here, AND a plain ADD/DROP COLUMN approach would fail because `suggested_reps_check` references the column being dropped. Migration was hand-written instead, following the precedent of `0003_muscle_group_color.sql`. File: `drizzle/0004_reps_range.sql`.
- [X] T003 Hand-written migration uses SQLite's table-rebuild pattern (CREATE NEW → INSERT...SELECT (copying `suggested_reps` into both `min_reps` and `max_reps`) → DROP OLD → RENAME → recreate unique index). This preserves all data including the `min_reps = max_reps = suggested_reps` invariant for migrated rows. The whole migration runs in one transaction via the existing migration runner.
- [X] T004 Update `src/db/routineHelpers.ts`: replace `suggestedReps: number` parameter with `minReps: number, maxReps: number` in both `addRoutineExercise` and `updateRoutineExercise`; update the Drizzle `.values()` and `.set()` calls accordingly
- [X] T005 Update `src/components/routines/routineUtilities.ts`: (a) replace `reps: number` with `minReps: number, maxReps: number` in `validateExercise`, update error keys to `minReps`/`maxReps`, add cross-field check `if (minReps > maxReps) errors.maxReps = 'Max reps must be ≥ min reps'`; (b) add `export const formatRepRange = (minReps: number, maxReps: number): string => minReps === maxReps ? \`\${minReps} reps\` : \`\${minReps}–\${maxReps} reps\``

**Checkpoint**: Data layer and utilities are updated. Run `npm run typecheck` — expect errors only in `RoutineEditor.tsx`, `ExerciseRow.tsx`, and `RoutineWorkoutExercise.tsx` (the UI phases below will fix each one).

---

## Phase 3: User Story 1 — Set Rep Range in Routine Editor (Priority: P1) 🎯 MVP

**Goal**: Replace the single "Suggested Reps" field in the routine exercise dialog with "Min Reps" and "Max Reps" fields, with full validation and correct save behaviour.

**Independent Test**: Open the routine editor → Add exercise dialog → two numeric fields ("Min Reps", "Max Reps") appear instead of one → entering 8 and 12 and saving stores both values → entering 12 and 8 shows a validation error and does not save.

### Implementation for User Story 1

- [X] T006 [US1] Update `src/components/routines/RoutineEditor.tsx`: replace `reps: string` with `minReps: string` and `maxReps: string` in `ExerciseFormState`; update `openAddExercise` defaults to `{ minReps: '8', maxReps: '12' }`; update `openEditExercise` to read `exercise.minReps`/`exercise.maxReps`; replace the single "Suggested reps" `TextField` in the dialog with two side-by-side `TextField` components ("Min Reps" / "Max Reps", each `type="number"` with `slotProps={{ htmlInput: { min: 1, max: 99 } }}`); update `exerciseErrors` type to use `minReps?`/`maxReps?`; update `handleExerciseSubmit` to parse both fields, pass to updated `validateExercise`, and pass to updated `addRoutineExercise`/`updateRoutineExercise`

**Checkpoint**: User Story 1 fully functional. Run `npm run typecheck` — only `ExerciseRow.tsx` and `RoutineWorkoutExercise.tsx` should still have errors.

---

## Phase 4: User Story 2 — Rep Range Display on Routine Card (Priority: P2)

**Goal**: Show the rep range (e.g., "8–12 reps" or "5 reps") wherever a routine exercise is listed in read-only view.

**Independent Test**: Save a routine with min = 8 / max = 12 → navigate to the routine list → exercise row shows "8–12 reps". Save another exercise with min = max = 5 → shows "5 reps" (not "5–5 reps").

### Implementation for User Story 2

- [X] T007 [P] [US2] Update `src/components/routines/ExerciseRow.tsx`: import `formatRepRange` from `routineUtilities`; replace `{exercise.suggestedSets} × {exercise.suggestedReps}` with `{exercise.suggestedSets} × {formatRepRange(exercise.minReps, exercise.maxReps)}`

**Checkpoint**: User Story 2 complete. Run `npm run typecheck` — only `RoutineWorkoutExercise.tsx` should have remaining errors.

---

## Phase 5: User Story 3 — Rep Range Guidance in Workout Form (Priority: P3)

**Goal**: When starting a workout from a routine, show the rep range as a read-only guidance label next to each exercise (e.g., "Target: 3 × 8–12 reps"). The reps input remains empty; no pre-fill.

**Independent Test**: Start a workout from a routine with min = 8 / max = 12 exercises → guidance label "Target: 3 × 8–12 reps" appears above the set rows → reps input fields are empty (no pre-fill).

### Implementation for User Story 3

- [X] T008 [P] [US3] Update `src/components/routines/RoutineWorkoutExercise.tsx`: import `formatRepRange` from `routineUtilities`; replace the guidance line `Suggested: {exercise.suggestedSets} × {exercise.suggestedReps}` with `Target: {exercise.suggestedSets} × {formatRepRange(exercise.minReps, exercise.maxReps)}`

**Checkpoint**: All three user stories complete. `npm run typecheck` should now pass with zero errors.

---

## Phase 6: Polish & Verification

- [ ] T009 Run `npm run typecheck` (must pass), `npm run lint` (must pass), `npm run build` (must pass); then manually smoke-test the feature per the five-step checklist in `specs/006-reps-range/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Requires Phase 2 complete
- **US2 (Phase 4)**: Requires Phase 2 complete; independent of US1
- **US3 (Phase 5)**: Requires Phase 2 complete; independent of US1 and US2
- **Polish (Phase 6)**: Requires Phases 3, 4, 5 all complete

### User Story Dependencies

- **US1**: Depends on T001–T005 (schema + helpers + validation)
- **US2**: Depends on T001–T005 (schema + formatRepRange); independent of US1
- **US3**: Depends on T001–T005 (schema + formatRepRange); independent of US1 and US2

### Within Each User Story

- Each story is a single file change (T006, T007, T008) — no sub-dependencies.

### Parallel Opportunities

- After Phase 2 completes, T006 (US1), T007 (US2), and T008 (US3) can all run in parallel since they touch different files.

---

## Parallel Example: After Phase 2

```
# All three UI tasks can run concurrently once Phase 2 is done:

Task A: "Update RoutineEditor.tsx (US1)" → src/components/routines/RoutineEditor.tsx
Task B: "Update ExerciseRow.tsx (US2)"   → src/components/routines/ExerciseRow.tsx
Task C: "Update RoutineWorkoutExercise.tsx (US3)" → src/components/routines/RoutineWorkoutExercise.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (schema, migration, helpers, utilities)
2. Complete Phase 3: US1 (RoutineEditor.tsx)
3. Also complete Phase 4 (ExerciseRow.tsx) and Phase 5 (RoutineWorkoutExercise.tsx) to fix remaining compile errors and restore a working build
4. **Validate**: Smoke-test per quickstart.md
5. Polish: Phase 6

### Incremental Delivery

All five implementation tasks (T001–T005 + T006–T008) are small, targeted changes. The natural delivery order is:

1. Foundation (T001–T005) — establishes the data layer
2. Editor (T006) — enables creating routines with rep ranges (US1)
3. Display (T007) — surfaces the range in the routine list (US2)
4. Workout (T008) — closes the planning→execution journey (US3)
5. Verify (T009)

---

## Notes

- T002 produces a file whose name includes a Drizzle-generated hash (e.g., `0004_reps_range.sql`). The exact name doesn't matter — the migration runner executes all files in alphabetical order.
- T003 is a mandatory manual edit — `drizzle-kit generate` does not produce data migration SQL. Without the `UPDATE` step, all existing rows will have `min_reps = 10` (the scaffold DEFAULT), not their original rep target.
- After T001, `npm run typecheck` will report errors in RoutineEditor, ExerciseRow, and RoutineWorkoutExercise. This is expected — those are the callsites that T006–T008 fix. Do not suppress them with `@ts-ignore`.
- `formatRepRange` uses an en-dash (`–`, U+2013) as the range separator, not a hyphen.
