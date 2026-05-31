---
description: "Task list for Persisted eRM & Optional Weight Entry"
---

# Tasks: Persisted eRM & Optional Weight Entry

**Input**: Design documents from `/specs/008-bodyweight-erm-weight/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, quickstart.md

**Tests**: No test runner configured (Constitution Principle V). No test tasks generated.

**Organization**: Tasks follow the implementation order from `quickstart.md` (which plan.md mandates), grouped by user story for traceability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: No new project infrastructure required — this feature is in-place edits to an existing app.

*(No setup tasks — proceed directly to Foundational.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, migration, and utility changes that must compile cleanly before any user story can be implemented. The `typecheck` failures introduced by these changes are intentional and resolved in later phases.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Update `workoutSet` table definition in `src/db/schema.ts`: remove `.notNull()` from `weight` field; add `erm: real('erm')` (nullable) field
- [x] T002 Run `npx drizzle-kit generate` to produce `drizzle/0006_persisted_erm.sql`; verify the generated SQL rebuilds `workout_set` with nullable `weight`, adds `erm`, preserves the unique index on `(workout_id, set_number)`, and copies existing rows with `erm = NULL`
- [x] T003 [P] Update `computeEffectiveWeight` in `src/utils/erm.ts`: change `loggedWeight` parameter type from `number` to `null | number`; add `const weight = loggedWeight ?? 0;` and update standard/bodyweight/assisted branches per the contract in `contracts/erm.ts.md`
- [x] T004 Update `src/database.ts`: (a) add `Set1_erm`–`Set5_erm: null | number` fields to `WorkoutTableRow` type; (b) add one `MAX(CASE WHEN s.set_number = N THEN s.erm END) AS SetN_erm` column per set number to the pivot query in `listWorkouts`; (c) update `sets` parameter of `createWorkout` and `updateWorkout` from `Array<{ reps: number; weight: number }>` to `Array<{ reps: number; weight: null | number; erm: null | number }>` and pass both fields in the Drizzle insert — full signatures in `contracts/database.ts.md`

**Checkpoint**: `npm run build` should pass (no consumers of `createWorkout`/`updateWorkout` have changed yet). `npm run typecheck` will surface call-site errors in `WorkoutForm.tsx` and `RoutineWorkoutForm.tsx` — that is expected and resolved in later phases.

---

## Phase 3: User Story 1 — Log a bodyweight set with no added weight (Priority: P1) 🎯 MVP

**Goal**: Allow weight field to be blank or 0 for bodyweight/assisted exercises, using body weight for eRM; validate and save with eRM in a single form action.

**Independent Test**: With body weight set to 80 kg and "Pull-up" classified as bodyweight, log a set leaving weight blank × 6 reps. Stored eRM ≈ 96 kg. The set saves without error. (Also covers US2: same form with body weight NOT set must block submission and show an error.)

### Implementation for User Story 1

- [x] T005 [US1] Update `validateWorkoutForm` and internal `validateWeight` in `src/components/workoutFormUtilities.ts`: add `bodyWeight: null | number` parameter to both; implement classification-specific weight rules per the table in `contracts/workoutFormUtilities.ts.md` (standard: require > 0; bodyweight: allow empty/0 only when bodyWeight is set; assisted: allow empty only when bodyWeight is set); use error message `'Body weight not set — add it in Settings to log this exercise'`
- [x] T006 [US1] Update `src/components/WorkoutForm.tsx`: (a) add `bodyWeight` state (`useState<null | number>(null)`) and load it via `getBodyWeight()` in a `useEffect` on mount; (b) pass `bodyWeight` to `validateWorkoutForm` call and add it to the `useCallback` dependency array; (c) add `computeSetERM` helper (per quickstart Step 5c) and build `parsedSets` with `weight` (null when blank) and `erm` before calling `createWorkout`/`updateWorkout`

**Checkpoint**: User Story 1 is fully functional. Log a bodyweight exercise with empty weight (body weight set) → set saves, eRM stored ≈ expected value. US2 is also covered: same form with body weight absent must block submission with the error message defined in T005.

---

## Phase 4: User Story 2 — Body weight not set: error on submission (Priority: P2)

**Goal**: Show a clear, actionable error when a user tries to log a bodyweight/assisted set with empty or 0 weight and body weight is missing from Settings.

**Independent Test**: With body weight NOT set, select "Pull-up" (bodyweight), leave weight blank, and submit. An error appears directing the user to Settings; no set is saved.

### Implementation for User Story 2

*(US2 is delivered entirely by T005 and T006 above. The validation rule and error message `'Body weight not set — add it in Settings to log this exercise'` are implemented in `validateWeight` as part of US1. No additional code changes are required.)*

**Checkpoint**: US2 is independently testable after T005–T006. Confirm: (a) bodyweight exercise + empty weight + no body weight → error shown, set not saved; (b) same exercise after setting body weight → submits cleanly.

---

## Phase 5: User Story 3 — Persisted eRM reflects body weight at time of logging (Priority: P3)

**Goal**: eRM is stored in the database at save time and displayed from the stored value; historical eRM is immutable after body weight changes.

**Independent Test**: Log a pull-up at body weight 80 kg → stored eRM = 96 kg. Update body weight to 85 kg. Revisit that workout row — it still shows 96 kg.

### Implementation for User Story 3

- [x] T007 [US3] Update `buildSetColumns` in `src/components/WorkoutSetRow.tsx`: add `ermKey = \`Set\${setNumber}_erm\`` accessor for each set; render eRM column using `formatERM(cell.getValue<null | number>())` reading from `WorkoutTableRow` (not computing at render time); remove `computeSetERM`, `SetColumnsOptions`, and imports of `computeEffectiveWeight`/`computeERM`; update `useSetColumns` signature to remove the `SetColumnsOptions` parameter
- [x] T008 [US3] Update `src/components/WorkoutTable.tsx`: remove `bodyWeight` and `classificationByName` props passed to `useSetColumns` (no longer accepted); add `Set2_erm` through `Set5_erm` to `HIDDEN_SET_COLUMNS`; remove the body weight fetch and exercise list fetch if they were only used for eRM display (verify they are not used for anything else first)

**Checkpoint**: US3 is independently testable. Log a set, check the stored eRM in the workout list. Update body weight, verify the historical row's eRM column is unchanged. Edit a set's reps → eRM updates to reflect current body weight.

---

## Phase 6: User Story 4 — Routine entry allows empty/zero weight for bodyweight exercises (Priority: P4)

**Goal**: Routine entries for bodyweight/assisted exercises accept blank or 0 weight; when a workout is started from such a routine, the form pre-populates correctly and follows BW-aware eRM rules.

**Independent Test**: Create a routine with "Push-up" (bodyweight) and blank weight. Start a workout from it — weight is pre-populated as blank, and saving the set uses body weight for eRM.

### Implementation for User Story 4

- [x] T009 [US4] Update `src/components/routines/RoutineWorkoutForm.tsx`: (a) add `exercises` state (`useState<Exercise[]>([])`) and `bodyWeight` state; fetch both in the existing `useEffect` via `Promise.all([getRoutineById, getBodyWeight, listExercises])`; (b) replace the existing two-step weight/reps filter in `handleSubmit` with the classification-aware filter from quickstart Step 7b; (c) in the `.map()`, compute `weight` (null when blank), `erm` via `computeEffectiveWeight` + `computeERM`, and return `{ erm, reps, weight }` per the quickstart
- [x] T010 [US4] Update `src/db/routineHelpers.ts`: change `LastExerciseSets` type so `weight` is `null | number` (was `number`); update the query result mapping to pass `row.weight` directly (null is now valid)
- [x] T011 [P] [US4] Update placeholder rendering in `src/components/routines/RoutineWorkoutExercise.tsx`: for null weight prefill, render empty string — `placeholder={prefillEntry ? (prefillEntry.weight !== null ? String(prefillEntry.weight) : '') : ''}`

**Checkpoint**: US4 is independently testable. Routine with BW + blank weight saves. Starting a workout from that routine shows blank weight. Logging the set saves with body weight–based eRM.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across all user stories.

- [x] T012 Run `npm run typecheck && npm run lint && npm run build` and fix any remaining type or lint errors
- [ ] T013 Manual verification per the checklist in `specs/008-bodyweight-erm-weight/quickstart.md` (Verification Checklist section): cover standard exercise with positive weight, BW exercise with empty weight (body weight set and unset), assisted exercise with negative weight, body weight update after logging, set edit, routine with empty-weight BW exercise, and pre-existing migrated sets showing `—` for eRM

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. **BLOCKS all user stories.**
- **US1 (Phase 3)**: Depends on Phase 2 completion (T001–T004).
- **US2 (Phase 4)**: Delivered by Phase 3 (T005–T006). No additional code.
- **US3 (Phase 5)**: Depends on Phase 2 (T004 — WorkoutTableRow + pivot query must include eRM columns). Can begin in parallel with Phase 3 once T004 is done.
- **US4 (Phase 6)**: Depends on Phase 2 (T003 — erm.ts). Can begin in parallel with Phase 3/5.
- **Polish (Phase 7)**: Depends on all previous phases.

### Within Each Phase

- T001 → T002 (sequential — must generate schema before migration)
- T003 can run in parallel with T001–T002 (different file: `src/utils/erm.ts`)
- T004 must follow T001 (schema changes inform the type definitions)
- T005 → T006 (sequential — WorkoutForm.tsx depends on updated validateWorkoutForm signature)
- T007 → T008 (sequential — WorkoutTable.tsx depends on the updated `useSetColumns` signature)
- T010 and T011 can run in parallel (different files: `routineHelpers.ts` vs `RoutineWorkoutExercise.tsx`)

### Parallel Opportunities

- T003 in parallel with T001–T002
- After T004: T005–T006 (Phase 3) and T009–T011 (Phase 4 US4 implementation) can proceed in parallel
- T010 and T011 within Phase 6 are parallel
- T007 and T009 are in different files and can proceed in parallel once T004 is done

---

## Parallel Example: Phase 2 Foundational

```
Start immediately:
  Task T001: Update src/db/schema.ts
  Task T003: Update src/utils/erm.ts (different file — run in parallel with T001)

After T001:
  Task T002: Generate drizzle/0006_persisted_erm.sql

After T001 + T003:
  Task T004: Update src/database.ts
```

## Parallel Example: After Phase 2

```
After T004 completes:
  Stream A: T005 → T006 (WorkoutForm — US1/US2)
  Stream B: T007 → T008 (WorkoutSetRow + WorkoutTable — US3)
  Stream C: T009, then T010 + T011 in parallel (Routine — US4)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001–T004)
2. Complete Phase 3: User Story 1 (T005–T006)
3. **STOP and VALIDATE**: Log a bodyweight set with empty weight. Confirm eRM stored. Confirm error shown when body weight is absent.
4. US2 is already covered — no extra steps.

### Incremental Delivery

1. Phase 2 (Foundational) → schema + types ready
2. Phase 3 (US1) + Phase 4 (US2) → core workout logging improved → Deploy/Demo MVP
3. Phase 5 (US3) → historical eRM immutability → Deploy
4. Phase 6 (US4) → routine support → Deploy
5. Phase 7 (Polish) → ship-ready

---

## Notes

- **Implementation order is mandated**: `plan.md` says to follow `quickstart.md` exactly; the task ordering above reflects those 8 steps.
- **No backfill**: Pre-existing sets will have `erm = NULL` after migration. The UI renders `—` for null eRM. This is intentional (Constitution Principle V, no retroactive recompute).
- **US2 shares code with US1**: The body-weight-not-set error is inside `validateWorkoutForm` (T005). No separate implementation phase is needed.
- **[P] tasks** = different files, no incomplete dependencies — safe to run concurrently.
- **[Story] label** maps each task to the user story it delivers for traceability.
