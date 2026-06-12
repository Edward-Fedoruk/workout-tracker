# Tasks: Routine UI Improvements

**Input**: Design documents from `specs/016-routine-ui-improvements/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: None — no test runner configured (Principle V).

**Organization**: Tasks grouped by user story for independent delivery. Two files are shared across stories (`RoutineWorkoutExercise.tsx`, `RoutineListView.tsx`, `useRoutineWorkout.ts`) — sequential ordering within those stories is enforced via dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[Story]**: Which user story this task belongs to
- All paths relative to repo root

---

## Phase 1: Setup

No new project setup required — this feature modifies existing files only.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type and schema changes that every user story depends on. Must complete before any US work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Extend `StoredSetValues` element type with `completed?: boolean` in `src/db/entities/routine-workout-draft/types.ts`
- [x] T002 [P] Extend `getLastSets` in `src/db/entities/routine-exercise/repository.ts` with per-position fallback: for each set position where the most recent workout has null weight and reps, run a second query to fetch the most recent non-null value at that position from any earlier workout
- [x] T003 [P] Add `completed: z.boolean().default(false)` to the per-set Zod schema in `src/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema.ts`

**Checkpoint**: Foundation ready — all user stories can now begin.

---

## Phase 3: User Story 1 — Start Workout from List (Priority: P1) 🎯 MVP

**Goal**: Each routine card shows exercise name chips instead of a count chip, and a green Start button sits next to the routine title. Edit/Delete are removed from the card.

**Independent Test**: Open Routines list. Verify each card shows one chip per exercise name (wrapping on overflow), a green Start button next to the title (disabled when no exercises), and no Edit or Delete buttons.

- [x] T004 [US1] Update `src/routes/routines/RoutineCard.tsx`: replace the "X exercises" count `Chip` with a flex-wrap `Box` of per-exercise-name `Chip`s (size="small"); move the Start button next to the routine title (color="success", disabled + tooltip when no exercises); remove `onEdit` and `onDelete` button elements and their props
- [x] T005 [P] [US1] Update `src/routes/routines/RoutineList/views/RoutineListView.tsx`: remove `onEdit` and `onDelete` props from `RoutineCardProps` usage and `RoutineListViewProps`; remove the `ConfirmDialog` (delete confirm moves to RoutineEditor in US5)
- [x] T006 [P] [US1] Update `src/routes/routines/RoutineList/hooks/useRoutines.ts`: remove delete confirm state (`pendingDelete`, `deleteConfirm`, `requestDelete`, `cancelDelete`, `handleConfirmDelete`) — these move to `useRoutineEditor` in US5

**Checkpoint**: Routine list cards show exercise chips and a green Start button; no Edit/Delete on cards.

---

## Phase 4: User Story 2 — Complete Sets and Log Workout (Priority: P1)

**Goal**: Each set row has a checkbox on the right. Tapping it marks the set complete (green row). Log Workout is disabled until all sets across all exercises are checked. Completion state persists in the draft on reload.

**Independent Test**: Open a routine workout. Check one set — row turns green. Reload — checked state is restored. Verify Log Workout stays disabled until every set is checked; tapping it succeeds only then.

- [x] T007 [US2] Update `src/routes/routines/RoutineWorkout/views/RoutineWorkoutExercise.tsx`: add `completed` field from `register(…sets.${setIndex}.completed)` as a controlled `Checkbox` on the right side of each set row; wrap each set row `Box` with `sx={{ bgcolor: completed ? 'success.light' : 'transparent', borderRadius: 1, transition: 'background-color 0.2s' }}`; call `onAutoSave()` on every checkbox change
- [x] T008 [US2] Update `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx`: use `watch('exercises')` to derive `allSetsCompleted = exercises.every(ex => ex.sets.every(s => s.completed === true))`; pass `disabled={isSubmitting || !allSetsCompleted}` to the Log Workout button
- [x] T009 [US2] Update `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`: in `autoSave`, serialise `completed` alongside `weight`/`reps` into `StoredDraftData`; in `load`, restore `completed: savedSet?.completed ?? false` into each set's `defaultValues`

**Checkpoint**: Completion checkboxes work end-to-end — checked state persists, Log Workout gates correctly.

---

## Phase 5: User Story 3 — Prefilled Set Values (Priority: P2)

**Goal**: Weight and reps inputs open pre-filled with the user's last logged values (real values, not placeholder text). If the most recent workout has no value at a set position, the app walks backwards to find one.

**Independent Test**: Log a workout for a routine exercise. Start the same routine — verify weight and reps inputs contain the previously logged values as actual input values (not greyed placeholder). Alter a value and log again; next time the new values appear.

- [x] T010 [US3] Update `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`: change `defaultValues` set construction so that when no saved draft exists for a set, `weight` and `reps` are sourced from `prefills.get(routineExercise.id)?.[setIndex]` as real numeric values (not `Number.NaN`); `Number.NaN` should only be used when both draft and prefill are absent for that position

**Checkpoint**: Inputs are populated with prior values on workout open; user can log without re-entering data.

---

## Phase 6: User Story 4 — Routine View Polish (Priority: P2)

**Goal**: Exercise headers show an avatar/icon on the left (matching exercise list style). Set labels use `LooksOneIcon`, `LooksTwoIcon`, `Looks3Icon` etc. instead of "Set N" text. Weight field label reads "kg".

**Independent Test**: Open any routine workout. Verify: avatar (or fallback FitnessCenterIcon) appears left of each exercise name; set rows show the numbered Looks icon; weight field label is "kg".

- [x] T011 [US4] Update `src/routes/routines/RoutineWorkout/views/RoutineWorkoutExercise.tsx`: add optional `imageFilename?: string` prop; render a MUI `Avatar` (height/width 56, same as ExerciseList) with `src` from `${import.meta.env.BASE_URL}exercises/${imageFilename}` when available and `<FitnessCenterIcon />` fallback, positioned left of the exercise name; import `LooksOneIcon … Looks5Icon` and replace the `<Typography>Set {n}</Typography>` label with the corresponding icon (color="secondary"); change `label="Weight (kg)"` → `label="kg"` on the weight `TextField`
- [x] T012 [US4] Update `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts` and `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx`: build an `exerciseImageMap: Map<string, string | undefined>` from the already-fetched `exercises` array (exercise name → imageFilename); pass `imageFilename={exerciseImageMap.get(routineExercise.exerciseName)}` to each `RoutineWorkoutExercise` in the view

**Checkpoint**: Workout view visually matches exercise list style; set icons and "kg" label in place.

---

## Phase 7: User Story 5 — List Page Layout & Add Button Convention (Priority: P3)

**Goal**: Routines page title is h6 (same as Workout Log). Add Routine becomes a FAB. Edit/Delete surface via a three-dots menu in the RoutineEditor header.

**Independent Test**: Open Routines page — title is h6, FAB bottom-right, no Edit/Delete on cards. Open a routine editor — three-dots ⋮ menu in header has "Edit name" and "Delete".

- [x] T013 [US5] Update `src/routes/routines/RoutineList/views/RoutineListView.tsx`: change title `variant` from `"h5"` to `"h6"` and `component="h1"`; remove the `<Button onClick={onAdd}>Add Routine</Button>`; add `<Fab color="secondary" onClick={onAdd} sx={{ bottom: 80, position: 'fixed', right: 24 }} aria-label="add routine"><AddIcon /></Fab>` matching WorkoutsView
- [x] T014 [US5] Update `src/routes/routines/RoutineEditor/hooks/useRoutineEditor.ts`: add delete confirm state (`pendingDelete`, `deleteConfirm`, `requestDelete`, `cancelDelete`, `handleConfirmDelete`) moved from `useRoutines`; add `openEditName` / `closeEditName` toggle for the name-edit modal
- [x] T015 [US5] Update `src/routes/routines/RoutineEditor/views/RoutineEditorView.tsx`: add `MoreVertIcon` `IconButton` to the header (top-right); wire a MUI `Menu` with `MenuItem` "Edit name" (calls `openEditName`) and `MenuItem` "Delete" (calls `requestDelete`); move `ConfirmDialog` for delete and `RoutineNameForm` modal here from the list

**Checkpoint**: Full feature complete — all five user stories functional and visually correct.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T016 [P] Run `npm run lint` and fix any lint errors introduced by the changes
- [x] T017 [P] Run `npm run typecheck` (`tsc -b`) and resolve any TypeScript errors
- [x] T018 Manual verification: follow all steps in `specs/016-routine-ui-improvements/quickstart.md` to confirm the golden path and edge cases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. **BLOCKS all user stories.**
- **US1 (Phase 3)**: Depends on Phase 2 complete. T004, T005, T006 can run in parallel.
- **US2 (Phase 4)**: Depends on Phase 2 complete. T007 → T008 → T009 (sequential, share `useRoutineWorkout.ts` and `RoutineWorkoutExercise.tsx`).
- **US3 (Phase 5)**: Depends on T002 (fallback query) and T009 (same file). Sequential with US2.
- **US4 (Phase 6)**: Depends on T007 (same file as T011). T011 and T012 can run in parallel after T007.
- **US5 (Phase 7)**: Depends on T005 and T006 (US1 removes from list; US5 adds to editor). T014 and T015 can run in parallel. T013 can run in parallel with T014/T015.
- **Polish (Phase 8)**: Depends on all phases complete.

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational.
- **US2 (P1)**: Can start immediately after Foundational. Independent of US1.
- **US3 (P2)**: Depends on T002 (Foundational) and T009 (US2 hook change in same file).
- **US4 (P2)**: Depends on T007 (US2 adds checkbox to same file RoutineWorkoutExercise.tsx).
- **US5 (P3)**: Depends on T005/T006 (US1 clears list view and hook for delete logic handoff).

### Parallel Opportunities Per Story

| Story | Parallel Tasks |
|-------|----------------|
| Foundational | T002, T003 (different files) |
| US1 | T005, T006 (after T004 sets prop interface) |
| US4 | T011, T012 (after T007) |
| US5 | T013, T014 (T015 after T014) |
| Polish | T016, T017 |

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 2: Foundational (T001–T003)
2. Complete Phase 3: US1 — exercise chips + Start button
3. Complete Phase 4: US2 — completion checkboxes + Log Workout gate
4. **STOP and VALIDATE**: manually test both P1 stories
5. Continue with US3, US4, US5 in sequence

### Incremental Delivery

1. Foundation (T001–T003) → unblocks everything
2. US1 (T004–T006) → list cards improved
3. US2 (T007–T009) → completion tracking works end-to-end
4. US3 (T010) → prefill live values
5. US4 (T011–T012) → visual polish complete
6. US5 (T013–T015) → FAB + three-dots menu
7. Polish (T016–T018) → ship-ready

---

## Notes

- `RoutineWorkoutExercise.tsx` is touched by T007 (US2) and T011 (US4) — do T007 first.
- `useRoutineWorkout.ts` is touched by T009 (US2), T010 (US3), and T012 (US4) — always sequential.
- `RoutineListView.tsx` is touched by T005 (US1) and T013 (US5) — do T005 first.
- Commit after each completed phase checkpoint.
- `Number.NaN` stays as the "empty field" sentinel for form inputs — prefill sets real numbers, not NaN.
