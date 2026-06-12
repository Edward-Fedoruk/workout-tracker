# Tasks: Workout UI Polish

**Input**: Design documents from `specs/015-workout-ui-polish/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not requested — no test runner configured (Constitution Principle V).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- File paths relative to repository root

---

## Phase 1: Setup

No project initialization needed — this is a UI polish feature within the existing project structure. Proceed directly to foundational changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data-layer and shared-utility changes that multiple user stories depend on. Must complete before any story phase begins.

**⚠️ CRITICAL**: US1 exercise-image column depends on T001/T002; set-cell formatting in all views depends on T003.

- [x] T001 Extend `WorkoutTableRow` type: add `exercise_image_filename: null | string` field in `src/db/entities/workout-log/types.ts`
- [x] T002 Update pivot SQL query in `src/db/entities/workout-log/repository.ts`: add `LEFT JOIN exercise e ON e.name = w.exercise_name`, select `e.image_filename AS exercise_image_filename`, add field to `GROUP BY` (depends on T001)
- [x] T003 [P] Update `src/routes/workouts/WorkoutSetRow.tsx`: (a) change `formatSetCell` to produce `weight×reps` / `×reps` / `weight` (no "kg", no spaces); (b) add `color="secondary"` to each `SetIcon` in `buildSetColumns` for both the main set column header and the eRM column header icon

**Checkpoint**: `WorkoutTableRow` now carries `exercise_image_filename`; `formatSetCell` produces compact output; set icons are green in the advanced table.

---

## Phase 3: User Story 1 — Compact, Scannable Log Table (Priority: P1) 🎯 MVP

**Goal**: The grouped workout table shows green icon headers, exercise thumbnails instead of names, and compact `80×5`-style set values with tighter typography.

**Independent Test**: Load the workout log. Confirm (a) five green numbered icons in the header row and no "Set N" text; (b) each workout row shows an exercise image (or dumbbell placeholder) with no text name visible; (c) a set value reads as `80×5` in 12px font with 10px horizontal padding.

- [x] T004 [US1] Update `src/routes/workouts/GroupedWorkoutTable/index.tsx`: replace plain `"Set {setNumber}"` `<TableCell>` headers with `LooksOneIcon`–`Looks5Icon` (imported from `@mui/icons-material`) rendered with `color="secondary"`
- [x] T005 [US1] Update `src/routes/workouts/GroupedWorkoutTable/index.tsx`: replace exercise-name `<TableCell>` with a 48px-wide fixed column containing a 40×40px `<img>` (URL: `` `${import.meta.env.BASE_URL}exercises/${row.exercise_image_filename}` ``) or `FitnessCenterIcon` placeholder when `exercise_image_filename` is null; remove the text `exercise_name` from the cell (depends on T001/T002)
- [x] T006 [US1] Update `src/routes/workouts/GroupedWorkoutTable/index.tsx`: add `sx={{ fontSize: '12px', px: '10px' }}` to each set-value `<TableCell>` (the five cells that call `formatSetCell`); confirm they reflect the new output from T003

**Checkpoint**: User Story 1 is fully functional. Open the grouped workout log and validate all three test criteria above.

---

## Phase 4: User Story 2 — Advanced Button in Table Header (Priority: P2)

**Goal**: The standalone "Advanced" button above the table is removed; the actions column header of the grouped table contains an "Advanced" button instead.

**Independent Test**: Load the workout log. Confirm there is no button above the table. Confirm the last column header contains an "Advanced" button that opens the full-screen advanced view when tapped.

- [x] T007 [US2] Update `src/routes/workouts/GroupedWorkoutTable/index.tsx`: add `onAdvanced: () => void` to `Props`; replace the empty last `<TableCell>` in `<TableHead>` with `<Button size="small" onClick={onAdvanced} variant="text">Advanced</Button>`
- [x] T008 [US2] Update `src/routes/workouts/views/WorkoutsView.tsx`: remove the `<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>` block containing the standalone "Advanced" button; pass `onAdvanced={handleAdvancedOpen}` to `<GroupedWorkoutTable>` (depends on T007)

**Checkpoint**: User Stories 1 and 2 are both functional. The Advanced control is only in the table header.

---

## Phase 5: User Story 3 — Three-Dot Action Menu (Priority: P2)

**Goal**: Inline Edit/Delete buttons in both the grouped table and the advanced view are replaced by a single vertical three-dot icon that opens a contextual menu.

**Independent Test**: In the grouped table and the advanced view, verify each workout row shows only a `MoreVertIcon` button. Tap it to confirm a menu with "Edit" and "Delete" items appears. Confirm each item triggers the correct flow.

- [x] T009 [US3] Create `src/routes/workouts/WorkoutRowActions/index.tsx`: component with same props as before (`onEdit: () => void`, `onDelete: () => void`); renders `IconButton` with `MoreVertIcon`; manages local `anchorEl` state; opens `Menu` with two `MenuItem`s — "Edit" (calls `onEdit`) and "Delete" (calls `onDelete`, styled `color="error"`); closes menu on backdrop click. Then delete `src/routes/workouts/WorkoutRowActions.tsx`.
- [x] T010 [P] [US3] Update import path in `src/routes/workouts/GroupedWorkoutTable/index.tsx` from `@/routes/workouts/WorkoutRowActions` to `@/routes/workouts/WorkoutRowActions/index` (or just `@/routes/workouts/WorkoutRowActions` — verify the resolver picks up the folder; adjust if needed) (depends on T009)
- [x] T011 [P] [US3] Update import path in `src/routes/workouts/AdvancedWorkoutTable/index.tsx` — same import-path update as T010 (depends on T009)

**Checkpoint**: User Story 3 is functional. Both tables show the three-dot menu. Edit and Delete flows work correctly in both views.

---

## Phase 6: User Story 4 — Advanced View Clean-Up (Priority: P3)

**Goal**: The advanced full-screen view removes the "Add Workout" toolbar button and the fullscreen toggle; table content clears the iPhone notch with extra top padding.

**Independent Test**: Open the advanced view. Confirm (a) no "Add Workout" button in any toolbar; (b) no fullscreen toggle icon; (c) content begins below the safe area with ≥16px extra top padding visible in a notch-device viewport simulation.

- [x] T012 [US4] Update `src/routes/workouts/AdvancedWorkoutTable/index.tsx`: (a) remove `onAdd` from `Props` and the `renderTopToolbarCustomActions` table option; (b) add `enableFullScreenToggle: false` to the `useMaterialReactTable` config; (c) wrap `<MaterialReactTable>` in `<Box sx={{ pt: 'max(env(safe-area-inset-top), 16px)' }}>` (or apply the sx directly to the table wrapper if BoxProps are accepted)
- [x] T013 [US4] Update `src/routes/workouts/views/WorkoutsView.tsx`: remove `onAdd={openCreate}` from the `<AdvancedWorkoutTable>` call (depends on T012)

**Checkpoint**: User Story 4 is functional. Advanced view is clean; safe-area top padding is visible.

---

## Phase 7: User Story 5 — Bottom Drawer for Add/Edit Workout (Priority: P3)

**Goal**: The workout add/edit form appears in a `SwipeableDrawer` anchored to the bottom of the screen instead of a centred `FormDialog`; height is content-driven up to 90dvh with internal scroll.

**Independent Test**: Tap the FAB. Confirm a sheet slides up from the bottom (not a centred overlay). Fill the form and save — confirm the workout is recorded and the drawer closes. Tap Edit on a row — confirm the same drawer opens pre-populated. Swipe down or tap the backdrop — confirm the drawer closes without saving.

- [x] T014 [US5] Update `src/routes/workouts/views/WorkoutsView.tsx`: (a) remove `FormDialog` import; (b) add `SwipeableDrawer` import from `@mui/material`; (c) replace the `<FormDialog …>` block with:
  ```tsx
  <SwipeableDrawer
    anchor="bottom"
    disableSwipeToOpen
    onClose={handleCancelForm}
    onOpen={() => undefined}
    open={formDialog.isOpen}
    sx={{
      '& .MuiDrawer-paper': {
        borderRadius: '12px 12px 0 0',
        maxHeight: '90dvh',
        overflowY: 'auto',
      },
    }}
  >
    <Box sx={{ p: 2 }}>
      <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">
          {editingWorkout ? 'Edit Workout' : 'Add Workout'}
        </Typography>
        <IconButton onClick={handleCancelForm}><CloseIcon /></IconButton>
      </Box>
      <WorkoutForm
        bodyWeight={bodyWeight}
        exercises={exercises}
        onCancel={handleCancelForm}
        onSave={handleSave}
        {...(editingWorkout ? { initialData: editingWorkout } : {})}
      />
    </Box>
  </SwipeableDrawer>
  ```

**Checkpoint**: User Story 5 is functional. Add and edit flows both use the bottom drawer. Save, dismiss, and pre-population all work.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T015 Run `npm run lint && npm run typecheck` from the repository root; resolve any type errors or lint warnings introduced by this feature (particularly around the updated `WorkoutTableRow` type flowing through `WorkoutDateGroup` and `GroupedWorkoutTable`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. T001→T002 must be sequential; T003 can run in parallel with T001/T002.
- **US1 (Phase 3)**: Depends on Phase 2 complete (T001/T002 for image column; T003 for cell format).
- **US2 (Phase 4)**: Depends on Phase 3 complete (same file — GroupedWorkoutTable).
- **US3 (Phase 5)**: Depends on Phase 2 complete; can begin after Phase 2 regardless of Phase 3/4 status if worked separately (different component), but GroupedWorkoutTable import update in T010 should follow T007/T008 to avoid a partial-file conflict.
- **US4 (Phase 6)**: Depends on Phase 5 complete (AdvancedWorkoutTable already updated by T011).
- **US5 (Phase 7)**: Depends on Phase 6 complete (WorkoutsView already updated by T008/T013).
- **Polish (Phase 8)**: Depends on all phases complete.

### User Story Dependencies

| Story | Depends on | Can parallelize with |
|-------|-----------|----------------------|
| US1 (P1) | Phase 2 | Nothing else in US1 (same file) |
| US2 (P2) | Phase 3 (same file) | US3 start (different file) |
| US3 (P2) | Phase 2 | T010/T011 parallel after T009 |
| US4 (P3) | Phase 5 | US5 start (different scope) |
| US5 (P3) | Phase 6 | — |

### Parallel Opportunities

**Phase 2**: T001 + T003 can start together; T002 starts after T001 resolves.

**Phase 5**: T010 and T011 can run in parallel after T009 is done (different files).

---

## Parallel Example: Phase 2

```text
Immediately:
  Task T001: Extend WorkoutTableRow type (types.ts)
  Task T003: Update formatSetCell + icon colors (WorkoutSetRow.tsx)

After T001:
  Task T002: Update pivot query (repository.ts)
```

## Parallel Example: Phase 5

```text
After T009 (WorkoutRowActions folder created):
  Task T010: Update GroupedWorkoutTable import (GroupedWorkoutTable/index.tsx)
  Task T011: Update AdvancedWorkoutTable import (AdvancedWorkoutTable/index.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (Foundational)
2. Complete Phase 3 (US1 — compact table)
3. **STOP and VALIDATE**: Open workout log; confirm icon headers, exercise images, compact set values
4. Continue to remaining stories

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 → Compact scannable table (MVP demo)
3. Phase 4 → Advanced button in header
4. Phase 5 → Three-dot action menus
5. Phase 6 → Advanced view clean-up
6. Phase 7 → Bottom drawer
7. Phase 8 → Polish / typecheck pass

Each phase delivers a visible, independently testable improvement without breaking prior phases.

---

## Notes

- `formatSetCell` change (T003) is shared by both tables — verifying it in US1 also validates the advanced table's set display.
- `WorkoutRowActions` props are unchanged after T009; only the import path changes in T010/T011.
- `WorkoutsView` is touched by T008 (US2), T013 (US4), and T014 (US5) across three separate phases — plan tasks sequentially to avoid merge conflicts.
- Run `npm run typecheck` after T001/T002 to catch any call sites that don't yet pass `exercise_image_filename`.
