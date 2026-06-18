# Tasks: Routine Inline Editing & UI Consistency

**Input**: Design documents from `/specs/018-routine-inline-editing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test runner is configured (Constitution Principle V) — no test tasks are generated.

**Organization**: Tasks grouped by user story (US1=P1, US2=P2, US3=P2, US4=P3) for independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story the task belongs to
- All paths are relative to repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the one new dependency. No schema migration (set count stays 1–5).

- [X] T001 Install drag-and-drop deps: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The merged-view backbone + DB helpers that US1, US2, and US3 all build on. (US4 is independent and does not depend on this phase.)

**⚠️ CRITICAL**: US1–US3 cannot begin until this phase is complete.

- [X] T002 [P] Add `reorder(routineId, orderedIds)` (two-pass negative-offset rewrite in a `BEGIN/COMMIT`) and `updateSetCount(id, suggestedSets)` (Drizzle update, guard 1–5) to `src/db/entities/routine-exercise/repository.ts`, following the existing `move`/`update` patterns and parameterized SQL.
- [X] T003 Export `reorderRoutineExercises(routineId, orderedIds)` and `setRoutineExerciseSetCount(id, suggestedSets)` from `src/database.ts` (depends on T002).
- [X] T004 [P] Create `src/routes/routines/RoutineWorkout/buildFormValues.ts` — a pure `buildFormValues(routine, draftData, prefills, exercises)` extracting the current inline `defaultValues` logic from `RoutineWorkoutView.tsx`.
- [X] T005 Extend `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`: add a `reload(routineId)` that re-fetches routine + prefills + draft and updates state, and an awaitable `saveDraftNow(values)` (awaits `saveDraft`) used before structural mutations.
- [X] T006 Create `src/routes/routines/RoutineWorkout/hooks/useRoutineStructure.ts` — exposes `structureVersion`, `rename`, `addExercise`, `editExercise`, `deleteExercise`, `addSet`, `removeSet`, `reorder`; each runs autosave-current-values → mutate via `@/database` helpers → `reload` → bump `structureVersion` (depends on T003, T005).
- [X] T007 [P] Extract `src/routes/routines/RoutineWorkout/views/RoutineWorkoutSetRow.tsx` from `RoutineWorkoutExercise.tsx` (weight/reps/completed fields + autosave-on-blur; add a `striped: boolean` prop, default styling unchanged for now).
- [X] T008 Create `src/routes/routines/RoutineWorkout/views/RoutineExerciseCard/index.tsx` scaffold — MUI `Card` wrapping the exercise header (avatar, name, target label) and the set rows via `RoutineWorkoutSetRow`; accept props/placeholders for three-dots, set buttons, and drag handle per `contracts/components.md` (depends on T007).
- [X] T009 Refactor `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx` to seed the form via `buildFormValues`, render one `RoutineExerciseCard` per exercise, and `reset(buildFormValues(...))` inside a `useEffect` keyed on a `structureVersion` prop; keep the existing Log Workout / Discard behavior (depends on T004, T008).
- [X] T010 Wire `src/routes/routines/RoutineWorkout/index.tsx` to compose `useRoutineStructure` with `useRoutineWorkout`, passing `structureVersion` and all structural callbacks + `getValues` plumbing into the view (depends on T006, T009).
- [X] T011 Add the merged-view route `/routines/:id` → `RoutineWorkout` in `src/router.tsx` (keep existing routes working for now) (depends on T009).

**Checkpoint**: Merged view renders cards and reloads correctly after a (test) structural call; logging still works.

---

## Phase 3: User Story 1 - Edit a routine while working out (Priority: P1) 🎯 MVP

**Goal**: From the merged view, rename the routine, add/delete exercises, add/remove sets, and edit rep ranges — all persisted to the routine template. Routine list collapses to a single tap-to-open entry; `+` creates a routine.

**Independent Test**: Open a routine, rename it, add an exercise, delete an exercise, add a set, remove a set, edit a rep range; reopen and confirm all persisted; log a workout successfully.

- [X] T012 [US1] Add a rename affordance (pencil) to the merged-view header in `RoutineWorkoutView.tsx` that opens the existing `src/routes/routines/RoutineNameForm.tsx`, calling the container's `onRename` → `updateRoutine`.
- [X] T013 [US1] Add an "Add exercise" action in `RoutineWorkoutView.tsx` opening the existing `src/routes/routines/RoutineExerciseForm.tsx` in create mode, calling `onAddExercise` → `addRoutineExercise`.
- [X] T014 [US1] Add the per-exercise three-dots `Menu` to `RoutineWorkout/views/RoutineExerciseCard/index.tsx`: "Edit" opens `RoutineExerciseForm` (edit mode, rep range) → `onEditExercise`; "Delete" opens `ConfirmDialog` (`@/components/ConfirmDialog`) → `onDeleteExercise`.
- [X] T015 [US1] Add outlined "+ Set" / "− Set" buttons beneath the set rows in `RoutineExerciseCard/index.tsx`, disabled at 5 / 1, calling `onAddSet` / `onRemoveSet` (current count ± 1).
- [X] T016 [P] [US1] Extend `src/routes/routines/RoutineList/hooks/useRoutines.ts` with `create()` (→ `createRoutine('New routine')`, returns id) and `remove(id)` (→ `deleteRoutine`, then refresh).
- [X] T017 [US1] Update `src/routes/routines/RoutineList/views/RoutineListView.tsx` and `src/routes/routines/RoutineCard.tsx`: row tap → open `/routines/:id`; the `+` FAB → `create()` then navigate to the new routine; add a row three-dots `Menu` with Delete (ConfirmDialog); remove the separate Start/Continue button (keep the "In Progress" chip) (depends on T016).
- [X] T018 [US1] Update `src/routes/routines/RoutineList/index.tsx` to implement onAdd (create+navigate) and onDelete, and remove `/routines/new` + `/routines/:id/edit` from `src/router.tsx` (depends on T011, T017).
- [X] T019 [US1] Delete the obsolete `src/routes/routines/RoutineEditor/` folder and `src/routes/routines/ExerciseRow.tsx`; fix any dangling imports (depends on T018).

**Checkpoint**: US1 fully functional — routines are created, edited, and logged entirely from the merged view; no separate editor remains.

---

## Phase 4: User Story 2 - Reorder exercises by dragging (Priority: P2)

**Goal**: Drag an exercise card to reorder; the new order persists to the routine.

**Independent Test**: With 3+ exercises, drag the third to the top; order updates and persists on reopen; entered set values stay with their exercises; works by touch.

- [X] T020 [P] [US2] Add `DndContext` + `SortableContext` (`verticalListSortingStrategy`) around the exercise cards in `RoutineWorkoutView.tsx`, with `PointerSensor` (`distance: 8`) and `TouchSensor` (`delay: 200, tolerance: 8`) sensors.
- [X] T021 [P] [US2] Make `RoutineExerciseCard/index.tsx` sortable via `useSortable` (keyed by `routineExercise.id`), applying transform/transition and wiring a dedicated `DragIndicator` drag handle (≥44px) to the sortable listeners so inputs remain usable.
- [X] T022 [US2] Implement `onDragEnd` in `RoutineWorkoutView.tsx` → `arrayMove` the ids → call `onReorder(orderedIds)` (→ `useRoutineStructure.reorder` → `reorderRoutineExercises`); cancelled/invalid drops leave order unchanged (depends on T020, T021).

**Checkpoint**: Drag reorder persists and preserves entered data.

---

## Phase 5: User Story 3 - Clearer exercise cards with completion feedback (Priority: P2)

**Goal**: Card per exercise, green when all its sets complete, alternating gray set rows.

**Independent Test**: Each exercise is a card with alternating gray set rows; completing all sets turns the card green; un-checking reverts.

- [X] T023 [P] [US3] In `RoutineExerciseCard/index.tsx`, derive `allCompleted` from the watched set values and apply a green card `bgcolor` (with transition) when true; revert otherwise.
- [X] T024 [P] [US3] In `RoutineWorkoutSetRow.tsx`, apply alternating gray background via the `striped` prop (`setIndex % 2`) while keeping the existing completed-row green tint precedence.

**Checkpoint**: Visual completion feedback works reactively.

---

## Phase 6: User Story 4 - Consistent add (plus) buttons (Priority: P3)

**Goal**: Replace the exercise-library top "Add …" text buttons with the plus FAB used on the log/routine screens; action follows the active tab.

**Independent Test**: Both library tabs add via the bottom-right plus FAB matching log/routine screens; the FAB action matches the active tab; no top "Add …" buttons remain.

- [X] T025 [US4] Add a single secondary `Fab` (`AddIcon`, `sx={{ bottom: 80, position: 'fixed', right: 24 }}`) with an `onAdd` prop to `src/routes/exercises/ExerciseLibrary/views/ExerciseLibraryView.tsx`.
- [X] T026 [US4] In `src/routes/exercises/ExerciseLibrary/index.tsx`, pass `onAdd = subView === 'exercises' ? exercises.openCreate : muscleGroups.openCreate` to the view (depends on T025).
- [X] T027 [P] [US4] Remove the top contained "Add exercise" button (and its `Stack`) from `src/routes/exercises/ExerciseLibrary/views/ExercisesSubView.tsx`; keep the `ExerciseForm` dialog.
- [X] T028 [P] [US4] Remove the top contained "Add muscle group" button (and its `Stack`) from `src/routes/exercises/ExerciseLibrary/views/MuscleGroupsSubView.tsx`; keep its dialog.

**Checkpoint**: One consistent add affordance across log, routine list, and exercise library.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T029 [P] Verify the merged view and library at a 320px viewport: touch drag works, three-dots/handles/buttons are ≥44px, no horizontal scroll (Principle VI).
- [X] T030 Run `npm run lint`, `npm run typecheck`, and `npm run build` — all must pass (stop-hook enforced).
- [ ] T031 Run the manual verification in `specs/018-routine-inline-editing/quickstart.md` end-to-end (`npm run dev`).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; blocks US1, US2, US3.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on Foundational (uses the card + `reorder` helper).
- **US3 (Phase 5)**: depends on Foundational (styles the card + set row).
- **US4 (Phase 6)**: independent — depends only on Setup (no `@dnd-kit` needed); can be done anytime.
- **Polish (Phase 7)**: after the desired stories are complete.

### User Story Dependencies

- US1, US2, US3 are independent of each other once Foundational is done (they touch the shared card but in distinct concerns: actions vs. drag vs. styling). US4 is fully independent.

### Within Foundational

- T002 → T003; T007 → T008 → T009; T004 → T009; T005/T006 → T010 (after T009); T009 → T011.

### Parallel Opportunities

- Foundational: T002 and T004 and T007 can start in parallel.
- US2: T020 and T021 in parallel, then T022.
- US3: T023 and T024 in parallel.
- US4: T027 and T028 in parallel; whole of US4 can run alongside the merged-view work.

---

## Parallel Example: Foundational kickoff

```bash
# These touch different files and can proceed together:
Task: "Add reorder() + updateSetCount() to routine-exercise/repository.ts"   # T002
Task: "Create RoutineWorkout/buildFormValues.ts"                              # T004
Task: "Extract RoutineWorkout/views/RoutineWorkoutSetRow.tsx"                 # T007
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1.
2. **STOP and validate**: create, edit, and log a routine entirely in the merged view; editor is gone.

### Incremental Delivery

1. Foundational ready → US1 (MVP, editing) → US2 (drag reorder) → US3 (card visuals) → US4 (add FAB).
2. US4 can ship at any point independently. Each story is a self-contained increment.
