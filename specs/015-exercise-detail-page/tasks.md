# Tasks: Exercise Detail Page

**Input**: Design documents from `specs/015-exercise-detail-page/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: No test runner configured (Constitution Principle V). No test tasks generated.

**Organization**: Tasks grouped by user story. Each phase is an independently testable increment.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Create new file structure — no logic yet, just folders and empty stubs.

- [X] T001 Create directory `src/routes/exercises/Exercise/ExerciseDetail/hooks/` and `src/routes/exercises/Exercise/ExerciseDetail/views/` (mkdir only)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New DB helpers and route registration. Nothing in Phases 3–6 compiles until these are done.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `getById(id: number): Promise<Exercise | null>` method to `ExerciseRepository` in `src/db/entities/exercise/repository.ts` — fetch single exercise with muscle groups using the same SQL+join pattern as `list()`, filtered to `WHERE id = ?`
- [X] T003 [P] Add `listByExerciseName(exerciseName: string): Promise<WorkoutTableRow[]>` method to `WorkoutLogRepository` in `src/db/entities/workout-log/repository.ts` — same pivoted MAX(CASE) query as `list()` but with `WHERE w.exercise_name = ?` bind param
- [X] T004 Export `getExerciseById` and `listWorkoutsByExerciseName` from `src/database.ts` following the existing thin-export pattern (depends on T002, T003)
- [X] T005 [P] Register route `{ element: <ExerciseDetail />, path: '/exercises/:id' }` in `src/router.tsx` — import `ExerciseDetail` from `@/routes/exercises/Exercise/ExerciseDetail`

**Checkpoint**: `npm run typecheck` passes (ExerciseDetail will be a stub at this point). Route `/exercises/1` renders without crash.

---

## Phase 3: User Story 1 — Navigate to Exercise Detail Page (Priority: P1) 🎯 MVP

**Goal**: Clean up exercise library list (no inline edit/delete buttons) and make every exercise row navigate to `/exercises/:id`.

**Independent Test**: Open the exercise library, confirm no edit/delete icons on any row. Tap any exercise — verify URL changes to `/exercises/<id>` and the detail page heading shows the exercise name.

- [X] T006 [P] [US1] Create `useExerciseDetail` hook skeleton in `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts` — accepts `exerciseId: number`, calls `getExerciseById`, manages `isLoading: boolean`, `notFound: boolean`, `exercise: Exercise | null` state; returns all three
- [X] T007 [P] [US1] Create `ExerciseDetailView` skeleton in `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx` — renders: back `IconButton` (ArrowBackIcon) that calls `onBack`, exercise `Avatar` (image or FitnessCenterIcon fallback), exercise name as `Typography variant="h6"`, muscle group `MuscleGroupChip` stack, loading spinner when `isLoading`, "Exercise not found" text when `notFound`
- [X] T008 [US1] Create `ExerciseDetail` container in `src/routes/exercises/Exercise/ExerciseDetail/index.tsx` — reads `:id` param via `useParams`, parses to number, calls `useExerciseDetail(id)`, calls `useNavigate` for `onBack` (`navigate(-1)`), renders `ExerciseDetailView` (depends on T006, T007)
- [X] T009 [P] [US1] Trim `useExercises` hook in `src/routes/exercises/ExerciseLibrary/hooks/useExercises.ts` — remove `openEdit`, `editingExercise`, `requestDelete`, `pendingDelete`, `deleteConfirm`, `confirmDelete`, `cancelDelete`; keep `exercises`, `refresh`, `openCreate`, `handleSave` (create path only), `dialog`, `dialogMode` (always `'create'`)
- [X] T010 [P] [US1] Update `ExerciseList` in `src/routes/exercises/Exercise/ExerciseList/index.tsx` — remove `onEdit`/`onDelete` props and the `secondaryAction` `Stack` with icon buttons; add `onNavigate: (exercise: Exercise) => void` prop; add `onClick={() => onNavigate(exerciseItem)}` and `sx={{ cursor: 'pointer' }}` to each `ListItem`
- [X] T011 [US1] Update `ExercisesSubView` in `src/routes/exercises/ExerciseLibrary/views/ExercisesSubView.tsx` — add `useNavigate`; replace `onDelete={requestDelete} onEdit={openEdit}` on `<ExerciseList>` with `onNavigate={(ex) => navigate('/exercises/' + ex.id)}`; remove the `<ConfirmDialog>` block; update props type to remove deleted fields from `UseExercisesReturn` (depends on T009, T010)

**Checkpoint**: Exercise library list renders cleanly with no action buttons per row. Tapping any exercise navigates to the detail page showing the exercise name, image, and muscle groups. Back button returns to the library.

---

## Phase 4: User Story 2 — Manage Exercise via Three-Dots Menu (Priority: P2)

**Goal**: Three-dots menu (`⋮`) on the exercise detail page with Edit and Delete options that invoke the existing business logic.

**Independent Test**: Open any exercise detail page. Tap `⋮` — menu appears with Edit and Delete. Edit opens the pre-filled exercise form dialog; save updates the exercise and the page refreshes. Delete shows a confirm dialog; confirming removes the exercise and navigates back to `/exercises`.

- [X] T012 [US2] Extend `useExerciseDetail` hook in `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts` — add `openEdit`, `editingExercise`, `dialog` (useToggle), `handleSave` (calls `updateExercise`, refreshes exercise), `requestDelete`, `pendingDelete`, `deleteConfirm` (useToggle), `confirmDelete` (calls `deleteExercise`, then `navigate('/exercises')`), `cancelDelete`; import `updateExercise`, `deleteExercise`, `listMuscleGroups` from `@/database`; also load `muscleGroups` state for the edit form
- [X] T013 [US2] Update `ExerciseDetailView` in `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx` — add `MoreVertIcon` `IconButton` in header row (right-aligned); add MUI `Menu` anchored to button with "Edit" and "Delete" `MenuItem`s; add `ExerciseForm` dialog (mode `'edit'`, `open={dialog.isOpen}`, pre-filled `initialValues`); add `ConfirmDialog` for delete with same copy as library (`"Delete exercise?" / "routine slots referencing it will be cleared"`); wire all new props from `useExerciseDetail` (depends on T012)

**Checkpoint**: Full edit/delete cycle works from the detail page. Behavior is identical to what the exercise library list previously provided.

---

## Phase 5: User Story 3 — View Exercise Log History on Detail Page (Priority: P2)

**Goal**: A date-grouped log history table on the exercise detail page, read-only, showing past workout entries for the exercise.

**Independent Test**: Open an exercise that has log history — confirm a date-grouped table of past sets appears below the exercise info. Open an exercise with no history — confirm "No history yet." empty state is shown.

- [X] T014 [US3] Make `onDelete` and `onEdit` optional in `GroupedWorkoutTable` in `src/routes/workouts/GroupedWorkoutTable/index.tsx` — change `Props` type to `onDelete?: (id: number) => void` and `onEdit?: (id: number) => void`; conditionally omit the last `<TableCell />` header and `<WorkoutRowActions>` cell when both props are absent; update `TOTAL_COLUMNS` accordingly
- [X] T015 [US3] Extend `useExerciseDetail` hook in `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts` — after fetching exercise, call `listWorkoutsByExerciseName(exercise.name)`; apply `groupWorkoutsByDate` (import from `@/utils/dateGroup`); expose `groups: WorkoutDateGroup[]`
- [X] T016 [US3] Add log history section to `ExerciseDetailView` in `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx` — render `<Typography variant="h6">History</Typography>` heading below exercise info; render `<GroupedWorkoutTable groups={groups} />` (no onDelete/onEdit); render `<Typography color="text.secondary">No history yet.</Typography>` when `groups.length === 0` (depends on T014, T015)

**Checkpoint**: Exercise detail page shows the full workout history for that exercise, grouped by date, most recent first. Empty state shows correctly for exercises with no logged history.

---

## Phase 6: User Story 4 — Navigate to Exercise Detail from Routine (Priority: P3)

**Goal**: Exercise names in the routine editor list are tappable and navigate to the exercise detail page.

**Independent Test**: Open any routine in the routine editor. Tap an exercise name — verify navigation to `/exercises/:id`. Back button returns to the routine editor.

- [X] T017 [US4] Add optional `onNavigateToExercise?: () => void` prop to `ExerciseRow` in `src/routes/routines/ExerciseRow.tsx` — when prop is provided, wrap the exercise name `Typography` in a `ButtonBase` with `onClick={onNavigateToExercise}`; style the `ButtonBase` to be transparent (no button chrome): `sx={{ textAlign: 'left', display: 'block' }}`
- [X] T018 [US4] Wire navigation in `RoutineEditorView` in `src/routes/routines/RoutineEditor/views/RoutineEditorView.tsx` — add `useNavigate`; for each `<ExerciseRow>`, look up the exercise ID: `libraryExercises.find(e => e.name === exercise.exerciseName)?.id`; pass `onNavigateToExercise={found ? () => navigate('/exercises/' + found.id) : undefined}` (depends on T017)

**Checkpoint**: All user stories are complete. Exercise name navigation works from routine editor.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T019 [P] Run `npm run typecheck` — resolve any TypeScript errors introduced across all modified files
- [X] T020 [P] Run `npm run lint` — resolve any lint/ESLint errors
- [X] T021 Walk through verification checklist in `specs/015-exercise-detail-page/quickstart.md` and confirm each item passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 (needs `getExerciseById` export + route)
- **US2 (Phase 4)**: Depends on Phase 3 (needs `ExerciseDetailView` and hook to exist)
- **US3 (Phase 5)**: Depends on Phase 3 (needs `ExerciseDetailView` and hook to exist); T014 (`GroupedWorkoutTable` change) can run in parallel with Phase 3
- **US4 (Phase 6)**: Depends on Phase 2 only (the route must exist); can run in parallel with Phases 3–5
- **Polish (Phase 7)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Blocks US2 and US3 (both add to the detail page built in US1)
- **US2 (P2)**: Can start once US1 complete
- **US3 (P2)**: Can start once US1 complete; T014 is independent and can run during Phase 3
- **US4 (P3)**: Needs only Phase 2 (route exists); independent of US1–US3

### Within Each Phase

- Tasks marked `[P]` touch different files and have no incomplete-task dependencies — run in parallel
- T006 and T007 can run in parallel (hook + view skeleton)
- T008 depends on T006 and T007
- T009 and T010 can run in parallel (different files)
- T011 depends on T009 and T010

### Parallel Opportunities

```text
Phase 2 parallel batch:
  T002  (exercise/repository.ts)
  T003  (workout-log/repository.ts)
  T005  (router.tsx)

Phase 3 parallel batch:
  T006  (ExerciseDetail/hooks/useExerciseDetail.ts)
  T007  (ExerciseDetail/views/ExerciseDetailView.tsx)
  T009  (ExerciseLibrary/hooks/useExercises.ts)
  T010  (Exercise/ExerciseList/index.tsx)
  T014  (workouts/GroupedWorkoutTable/index.tsx) ← can start here, needed for Phase 5
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002–T005)
3. Phase 3: US1 (T006–T011)
4. **STOP and VALIDATE**: Exercise library list clean, tap → detail page works, back navigates correctly
5. Continue to US2 + US3 to complete the detail page

### Incremental Delivery

1. Setup + Foundational → DB helpers + route stub ready
2. US1 → Clean list + navigable detail page (MVP)
3. US2 → Edit/delete from three-dots menu (full parity with old list)
4. US3 → Log history on detail page (new capability)
5. US4 → Routine tappable names (access shortcut)
6. Polish → Typecheck, lint, verification checklist

---

## Notes

- No migration files needed — schema is unchanged
- `GroupedWorkoutTable` change (T014) is backward-compatible; existing callers pass both `onDelete`/`onEdit` and continue working
- `useExercises` trimming (T009) removes dead state — update `ExerciseSubViewProps` type accordingly in T011
- `ExerciseRow` change (T017) is backward-compatible; `onNavigateToExercise` is optional
- All new imports must use `@/` alias — no `../` relative imports across directories
