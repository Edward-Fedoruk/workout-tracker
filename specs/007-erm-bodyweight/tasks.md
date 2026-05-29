# Tasks: eRM & Body Weight Settings

**Input**: Design documents from `specs/007-erm-bodyweight/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/settingsHelpers.ts.md, contracts/erm.ts.md, quickstart.md

**Tests**: Not configured (Constitution Principle V). Manual browser verification is the acceptance gate for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema, core utility functions, and updated exercise helpers that all three user stories depend on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Phase 2 must be fully complete before any Phase 3/4/5 task begins.

- [X] T001 Update `src/db/schema.ts`: (1) add `appSetting` table export (`key TEXT PRIMARY KEY, value TEXT NOT NULL`); (2) add `classification` column to `exercise` table with enum `['standard', 'bodyweight', 'assisted']`, default `'standard'`, and a `check` constraint; (3) remove the `check('weight_check', ...)` line from `workoutSet` — see `data-model.md` for exact Drizzle definitions

- [X] T002 Run `npx drizzle-kit generate` to produce `drizzle/0005_erm_bodyweight.sql`; open the file and verify the `workout_set` section performs a full table-rebuild (create `__new_workout_set`, copy rows, drop original, rename) matching the SQL in `data-model.md §3` — edit the file manually if Drizzle produced a no-op for the constraint drop; commit both `src/db/schema.ts` and `drizzle/0005_erm_bodyweight.sql`

- [X] T003 [P] Create `src/db/settingsHelpers.ts`: implement `getBodyWeight(): Promise<number | null>` and `setBodyWeight(kg: number): Promise<void>` per `contracts/settingsHelpers.ts.md`; use `getPromiser` / `getDatabaseId` / `initDatabase` following the existing helper pattern; include input validation in `setBodyWeight` (positive, ≤ 500, ≤ 2 decimal places)

- [X] T004 [P] Create `src/utils/erm.ts`: export `ExerciseClassification` type, `computeEffectiveWeight({ bodyWeight, classification, loggedWeight }): number | null`, and `computeERM(effectiveWeight: number, reps: number): number` per `contracts/erm.ts.md`; file must be pure (no async, no imports from `src/db`)

- [X] T005 Update `src/db/exerciseHelpers.ts`: (1) export `ExerciseClassification = 'standard' | 'bodyweight' | 'assisted'` type; (2) add `classification: ExerciseClassification` to the `Exercise` type and `ExerciseRow` internal type; (3) include `classification` in the SELECT query in `listExercises`; (4) add `classification: ExerciseClassification` parameter to `createExercise` and `updateExercise` and persist it in the INSERT/UPDATE SQL (depends on T001 for schema, T003/T004 can proceed in parallel)

- [X] T006 Re-export `getBodyWeight` and `setBodyWeight` from `src/database.ts` alongside the existing exports (depends on T003, T005)

**Checkpoint**: Run `npm run typecheck && npm run lint` — must pass clean before moving to Phase 3.

---

## Phase 3: User Story 1 — See eRM for every logged set (Priority: P1) 🎯 MVP

**Goal**: Every logged set in the workout log displays an eRM value computed via the Epley formula. Standard exercises (the majority) work with no user configuration.

**Independent Test**: Log a bench press set at 100 kg × 5 reps. The workout log row for that set shows an eRM of ~116.7 kg. No body weight or exercise classification setup required.

- [X] T007 [US1] Extract a `WorkoutSetRow` presentational component from `src/components/WorkoutTable.tsx` (currently 283 lines, already over the 200-line limit) into `src/components/WorkoutSetRow.tsx`; move per-set rendering logic into the new component; confirm `WorkoutTable.tsx` drops below ~200 lines after extraction (Constitution Principle VIII)

- [X] T008 [US1] In `src/components/WorkoutTable.tsx`, load body weight via `getBodyWeight()` and the exercise list via `listExercises()` on mount alongside the existing `listWorkouts()` call; store both in component state; build a `classificationByName: Map<string, ExerciseClassification>` lookup (depends on T007)

- [X] T009 [US1] In `src/components/WorkoutTable.tsx`, add an eRM display to each set row: call `computeEffectiveWeight` with the set's `weight`, its exercise's `classification` from the map, and the loaded `bodyWeight`; if non-null call `computeERM(effectiveWeight, reps)` and display rounded to one decimal place; display `"—"` when `computeEffectiveWeight` returns `null` (depends on T008)

**Checkpoint**: `npm run dev` → log a standard exercise set → confirm eRM appears. Log a body-weight exercise with body weight not set → confirm `"—"` appears. No regressions in existing log editing/deleting.

---

## Phase 4: User Story 2 — Enter and edit body weight in Settings (Priority: P2)

**Goal**: A dedicated Settings page is reachable from the main navigation. The user can enter and save their body weight (positive decimal, up to 2 decimal places, ≤ 500 kg); the value persists across reloads.

**Independent Test**: Open Settings from the tab bar → enter `75.25` → press Save → reload the app → Settings still shows `75.25`.

- [X] T010 [P] [US2] Add `{ type: 'settings' }` to the `ActiveView` union in `src/App.tsx`; add `'settings'` to the `showTabBar` condition so the tab bar remains visible on the Settings page

- [X] T011 [P] [US2] Create `src/components/settings/SettingsPage.tsx`: container component that (1) calls `getBodyWeight()` on mount and populates a controlled numeric input; (2) tracks unsaved edits in local state without auto-saving; (3) on Save button press validates (positive, ≤ 500, ≤ 2 dp) and calls `setBodyWeight`; (4) shows success confirmation or inline error message; (5) discards uncommitted input if the user navigates away; touch target ≥ 44 × 44 px (Constitution Principle VI)

- [X] T012 [US2] In `src/App.tsx`, import `SettingsPage`, add a "Settings" `<Tab>` to the `<Tabs>` bar, add a `'settings'` branch in `renderContent()` that renders `<SettingsPage />`, and wire the tab `onChange` to `setActiveView({ type: 'settings' })` (depends on T010 and T011)

**Checkpoint**: `npm run dev` → navigate to Settings tab → enter a value → Save → confirm value persists after page reload. Enter an invalid value (e.g., `-5`) → confirm Save is rejected with an error message and the previous value is unchanged.

---

## Phase 5: User Story 3 — eRM for body-weight and assisted exercises (Priority: P3)

**Goal**: Users can classify exercises as Standard / Body weight / Assisted. The workout log computes eRM using body weight for body-weight/assisted exercises. Assisted exercises accept negative logged weights.

**Independent Test**: Set body weight to 75 kg in Settings. Create a "Pull-up" exercise with classification "Body weight". Log 0 kg × 8 reps. The workout log shows eRM ≈ 87.5 kg (75 × (1 + 8/30)). Create "Assisted Pull-up" with classification "Assisted". Log −30 kg — input is accepted. eRM ≈ 52.2 kg (45 × (1 + 8/30)).

- [X] T013 [P] [US3] Add a classification selector to `src/components/exercises/ExerciseForm.tsx` (currently 162 lines): a `<Select>` or radio group with three options (Standard / Body weight / Assisted), default Standard; pass the selected value to `createExercise` and `updateExercise`; display the current classification when editing an existing exercise (depends on T005 for updated helper signatures)

- [X] T014 [P] [US3] Extract weight validation logic from `src/components/WorkoutForm.tsx` (currently 310 lines, over limit) into `src/components/workoutFormUtils.ts`; move any pure validation/helper functions that do not need JSX into the new file and import them back; confirm `WorkoutForm.tsx` drops toward ~200 lines (Constitution Principle VIII)

- [X] T015 [US3] In `src/components/WorkoutForm.tsx`, look up the selected exercise's `classification` from the loaded exercise list; replace the hard-coded `weight > 0` rule with classification-aware validation: standard → `weight > 0`; bodyweight → `weight >= 0`; assisted → any finite value (negative allowed); update the weight input's `min` attribute accordingly (depends on T014)

**Checkpoint**: `npm run dev` → create a body-weight exercise → log 0 kg reps → accepted, eRM shown. Create an assisted exercise → enter −30 kg → accepted. Confirm standard exercises still reject 0 and negative weights.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Constitutional compliance, narrow-viewport check, final lint/typecheck pass.

- [ ] T016 Run `npm run dev` and verify the full UI at a 375 px-wide viewport (browser DevTools device emulation): Settings tab is reachable and the body weight input is usable; eRM column in the workout log is readable and does not cause horizontal scroll; exercise classification selector is touch-friendly (Constitution Principle VI)

- [X] T017 Run `npm run typecheck && npm run lint` from repo root; fix all type errors using correct types (no `as any`, no `as unknown as X` — Constitution Principle IX); fix all lint warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. **BLOCKS all user stories.**
- **User Story 1 (Phase 3)**: Requires Phase 2 complete (needs `computeERM`, `getBodyWeight`, `listExercises` with classification).
- **User Story 2 (Phase 4)**: Requires Phase 2 complete (needs `getBodyWeight`, `setBodyWeight`). Independent of US1.
- **User Story 3 (Phase 5)**: Requires Phase 2 complete (needs updated `createExercise`/`updateExercise` with classification). Requires US1 complete (the eRM display in T009 must already handle classification correctly). Requires US2 complete (body weight must be settable for the acceptance test).
- **Polish (Phase 6)**: Requires all desired user stories complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependency on US2 or US3.
- **US2 (P2)**: Can start after Phase 2 in parallel with US1.
- **US3 (P3)**: Depends on US1 (eRM infrastructure), US2 (body weight must be settable), and Phase 2.

### Within Each Phase

- T003 and T004 are parallel (different files, no inter-dependency).
- T010 and T011 are parallel (different files, no inter-dependency).
- T013 and T014 are parallel (different files, no inter-dependency).
- All other tasks within a phase are sequential (same file or hard dependency).

---

## Parallel Examples

### Phase 2 (Foundational)

```
# After T001+T002 are done, launch in parallel:
T003: Create src/db/settingsHelpers.ts
T004: Create src/utils/erm.ts
# Then sequentially:
T005: Update src/db/exerciseHelpers.ts
T006: Re-export from src/database.ts
```

### Phase 4 (User Story 2)

```
# Launch in parallel:
T010: Add 'settings' to ActiveView in src/App.tsx
T011: Create src/components/settings/SettingsPage.tsx
# Then:
T012: Wire SettingsPage into App.tsx
```

### Phase 5 (User Story 3)

```
# Launch in parallel:
T013: Classification selector in src/components/exercises/ExerciseForm.tsx
T014: Extract workoutFormUtils.ts from src/components/WorkoutForm.tsx
# Then:
T015: Classification-aware weight validation in src/components/WorkoutForm.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (Foundational) — run typecheck/lint checkpoint
2. Complete Phase 3 (US1: eRM in workout log)
3. **STOP and VALIDATE**: every logged set shows eRM; standard exercises need no setup
4. Ship or demo

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 (US1) → eRM for standard exercises **[MVP]**
3. Phase 4 (US2) → Settings page, body weight persisted
4. Phase 5 (US3) → Classification selector + body-weight/assisted eRM
5. Phase 6 → Polish

---

## Notes

- [P] tasks touch different files with no shared state — safe to parallelise.
- `WorkoutTable.tsx` (283 lines) and `WorkoutForm.tsx` (310 lines) are already over the 200-line soft limit. Extraction tasks T007 and T014 are constitutional requirements, not optional refactors.
- eRM is never stored in the DB — it is always derived at render time. No migration touches eRM.
- The `weight_check` constraint removal (T002) is the trickiest migration step; the manual review instruction in T002 is important.
- Commit after each logical group of tasks or after each phase checkpoint.
