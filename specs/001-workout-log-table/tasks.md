# Tasks: Workout Log Table

**Feature**: Workout Log Table  
**Branch**: `001-workout-log-table`  
**Date Created**: 2026-05-18  
**Status**: Ready for Implementation

## Overview

This task list implements a responsive workout logging table for the React PWA. Tasks are organized by user story to enable independent implementation and testing. The feature persists workout data (exercise name, date, up to 5 sets with weight/reps) to SQLite-WASM via OPFS with validation for past/current dates and minimum 1 set per workout.

**MVP Scope**: User Story 1 (Log a New Workout) — core functionality that enables all subsequent features.

## Implementation Strategy

1. **Phase 1: Database Setup** — Create schema and foundational DB helpers
2. **Phase 2: User Story 1 (P1: Log a New Workout)** — Form to capture workouts + persistence
3. **Phase 3: User Story 2 (P2: View Workout History)** — Display workouts in table, sorted most-recent-first
4. **Phase 4: User Story 3 (P3: Edit/Delete)** — Modify and delete entries
5. **Phase 5: Polish & Integration** — Responsive design, testing across viewports

**Parallel Opportunities**:
- Tasks T002 and T003 (database helpers) can be developed in parallel
- Form component (T004) and table component (T008) can be developed in parallel after DB helpers
- Edit/delete functionality (Phase 4) can be developed alongside table

---

## Phase 1: Database Setup

Database schema, migrations, and typed helpers for all CRUD operations.

- [x] T001 Add `workout_log` table schema to `src/database.ts` `initDatabase()` function
  - Create TABLE with columns: id (PK), workout_date (DATE, NOT NULL, ≤ TODAY), exercise_name (TEXT, NOT NULL), created_at (TIMESTAMP), updated_at (TIMESTAMP)
  - Add CHECK constraint: `workout_date <= DATE('now')`
  - Reference: `data-model.md` Entities section

- [x] T002 [P] Add `workout_set` table schema to `src/database.ts` `initDatabase()` function
  - Create TABLE with columns: id (PK), workout_id (FK→workout_log), set_number (1-5, UNIQUE per workout), weight (REAL, > 0), reps (INTEGER, > 0)
  - Add FOREIGN KEY with ON DELETE CASCADE
  - Add CHECK constraints for set_number range (1-5) and positive weight/reps
  - Reference: `data-model.md` Entities section

- [x] T003 [P] Export database helper functions from `src/database.ts`:
  - `createWorkout(workoutDate: string, exerciseName: string, sets: Array<{weight: number, reps: number}>): Promise<number>` — Insert workout + sets, return workout ID
  - `listWorkouts(): Promise<WorkoutTableRow[]>` — Fetch all workouts sorted by date DESC, flattened to table format
  - `getWorkoutById(id: number): Promise<WorkoutWithSets | null>` — Fetch single workout with all its sets
  - `updateWorkout(id: number, workoutDate: string, exerciseName: string, sets: Array<{weight: number, reps: number}>): Promise<void>` — Update workout metadata and replace sets
  - `deleteWorkout(id: number): Promise<void>` — Delete workout and all its sets
  - All functions use parameterized SQL with bind arrays (per Constitution Principle IV)
  - Reference: `quickstart.md` Phase 1 section

---

## Phase 2: User Story 1 (P1) — Log a New Workout

Create form component and integrate with database to allow users to log workout entries.

- [x] T004 [US1] Create `src/components/WorkoutForm.tsx` component (container)
  - State: workoutDate (string, default today), exerciseName (string), sets array (1-5 items, each with weight/reps strings)
  - Input fields:
    - Date picker: `<input type="date">` with max="today", bind to workoutDate
    - Exercise name input: text field, required
    - Dynamic sets list: numbered rows with weight (number input, min=0.1, step=0.1) and reps (number input, min=1, step=1) inputs
  - Add/Remove set buttons:
    - "Add Set" button: enabled if <5 sets, disabled if 5 sets
    - "Remove Set" button: hidden if 1 set, enabled if >1 sets (removes last set)
  - Validation (form-level, before DB call):
    - exerciseName: required, non-empty
    - sets: minimum 1, maximum 5
    - weight: each >0, parseable as number
    - reps: each >0, parseable as integer
    - workoutDate: not in future (compare to today)
  - Save/Cancel buttons with loading state
  - Show validation error messages inline (red text next to invalid fields)
  - Reference: `quickstart.md` Phase 2 (Form Component) section

- [x] T005 [US1] Implement save logic in `WorkoutForm.tsx`:
  - onSave handler: validate form → call `createWorkout()` from database helpers → on success: reset form, close modal, refresh parent table
  - Error handling: catch DB errors, display user-friendly error message (toast or alert)
  - Loading state: disable buttons, show spinner during save
  - Reference: `quickstart.md` Phase 2 (Form Component) section

- [ ] T006 [US1] Integrate `WorkoutForm` into `WorkoutTable` component:
  - Add "Add Workout" button above the table
  - Clicking button opens modal or shows form inline
  - Form passes onSave callback to refresh table after successful save
  - Form has onCancel callback to close modal
  - Reference: `quickstart.md` Phase 3 (Table Component) section

- [ ] T007 [US1] Test User Story 1 workflow:
  - Manual test (no automated tests per Constitution Principle V):
    1. Click "Add Workout"
    2. Enter today's date, exercise name "Bench Press", 2 sets (Set1: 60kg, 10 reps; Set2: 65kg, 8 reps)
    3. Click Save
    4. Verify form closes and table updates
    5. Close and reopen app
    6. Verify workout persists in SQLite
  - Test validation:
    - Try saving with 0 sets → error message
    - Try saving with empty exercise name → error message
    - Try entering tomorrow's date → error message
  - Reference: `spec.md` User Story 1 - Acceptance Scenarios

---

## Phase 3: User Story 2 (P2) — View Workout History

Display workouts in responsive table sorted by date (most recent first).

- [ ] T008 [US2] Create `src/components/WorkoutTable.tsx` component (container):
  - State: workouts array, isLoading boolean, editingId (null or number)
  - useEffect on mount: call `listWorkouts()`, set state
  - Reference: `quickstart.md` Phase 3 (Table Component) section

- [ ] T009 [US2] Implement table rendering in `WorkoutTable`:
  - Use Chakra UI `<Table>` or HTML `<table>` with CSS flexbox/grid
  - Column headers: workout_date | exercise_name | Set1_weight | Set1_reps | Set2_weight | Set2_reps | Set3_weight | Set3_reps | Set4_weight | Set4_reps | Set5_weight | Set5_reps | Actions
  - Each row: maps to a WorkoutTableRow (flattened data structure from database helper)
  - Display cells:
    - workout_date: formatted as readable date (YYYY-MM-DD)
    - exercise_name: plain text
    - Set*_weight, Set*_reps: display weight in kg, reps as number; empty cells for unused sets
  - Actions column: Edit and Delete buttons (per US3 tasks)
  - Empty state: "No workouts yet. Add your first one!" if workouts array is empty
  - Loading state: Spinner while `isLoading` is true
  - Reference: `spec.md` User Story 2 - Acceptance Scenarios

- [ ] T010 [US2] Implement sorting and table responsiveness:
  - Sort by workout_date DESC (most recent first) — already done by `listWorkouts()` helper, but document in component
  - Responsive layout:
    - Mobile (≥320px, <640px): Hide Set3_weight, Set3_reps, Set4_weight, Set4_reps, Set5_weight, Set5_reps columns OR use horizontal scroll (if unavoidable)
    - Tablet (≥640px, <1024px): Show all columns, may wrap
    - Desktop (≥1024px): Full table display
  - Use Chakra Table `hideBelow` prop or CSS `@media` queries to conditionally hide columns
  - Touch targets: Edit/Delete buttons ≥44×44px
  - No horizontal scroll at ≥320px unless carousel-like interaction
  - Reference: Constitution Principle VI (Mobile-First, Adaptive UI) and `quickstart.md` Phase 3 section

- [ ] T011 [US2] Test User Story 2 workflow:
  - Manual test (no automated tests per Constitution Principle V):
    1. Log 3+ workouts (using US1 functionality)
    2. View table — all workouts visible with correct date, exercise, weight/reps
    3. Verify most recent workout appears first
    4. Verify columns are readable (dates clear, numbers clear, no overlap)
    5. Test at multiple viewports:
       - Mobile 375px: Columns wrap or some hidden, no horizontal scroll
       - Tablet 768px: Most columns visible
       - Desktop 1280px: Full table
  - Reference: `spec.md` User Story 2 - Acceptance Scenarios

---

## Phase 4: User Story 3 (P3) — Edit/Delete Workout Entry

Add edit and delete functionality to existing workouts.

- [ ] T012 [US3] Implement Edit button in `WorkoutTable`:
  - Edit button in Actions column for each row
  - On click: set `editingId` to workout ID, populate `WorkoutForm` with existing data (call `getWorkoutById`)
  - Show form in modal or replace table view
  - Form save handler: call `updateWorkout()`, refresh table
  - Form cancel: set `editingId` to null, show table
  - Reference: `quickstart.md` Phase 4 section (if exists) or `spec.md` User Story 3 - Acceptance Scenarios

- [ ] T013 [US3] Implement Delete button in `WorkoutTable`:
  - Delete button in Actions column for each row
  - On click: show confirmation dialog "Are you sure you want to delete this workout?"
  - If confirmed: call `deleteWorkout(id)`, refresh table
  - If cancelled: close dialog, table unchanged
  - Show error message if delete fails (DB error)
  - Reference: `spec.md` User Story 3 - Acceptance Scenarios

- [ ] T014 [US3] Update `WorkoutForm` to support edit mode:
  - When `editingId` is set, populate form with existing workout data
  - Change form title/button text: "Edit Workout" vs. "Add Workout"
  - Workflow: User clicks Edit → form opens with pre-filled data → user modifies → clicks Save → `updateWorkout()` called → table refreshes

- [ ] T015 [US3] Test User Story 3 workflow:
  - Manual test (no automated tests per Constitution Principle V):
    1. Log a workout with exercise "Bench Press", Set1: 60kg, 10 reps
    2. Click Edit on that row
    3. Change Set1_weight to 65kg, add Set2: 60kg, 8 reps
    4. Click Save
    5. Verify table updates immediately with new data
    6. Close and reopen app
    7. Verify changes persisted in SQLite
    8. Delete that workout, confirm dialog appears
    9. Click confirm
    10. Verify workout removed from table
  - Test edge cases:
    - Try editing to remove all sets → validation error
    - Try editing to add 6th set → prevented by UI
  - Reference: `spec.md` User Story 3 - Acceptance Scenarios

---

## Phase 5: Polish & Integration

Final testing, responsive design verification, and full-app integration.

- [ ] T016 Mount `WorkoutTable` in `src/App.tsx`:
  - Place inside the `isDbReady` gate (after `initDatabase()` resolves)
  - Example: 
    ```tsx
    {isDbReady && <WorkoutTable />}
    ```
  - Verify component doesn't render until DB is ready
  - Reference: `quickstart.md` Phase 4 (App Integration) section and CLAUDE.md Architecture Invariants

- [ ] T017 [P] Test form validation and error messages:
  - Attempt to save workout with invalid data:
    - No sets: "Must have at least 1 set"
    - Empty exercise: "Exercise name is required"
    - Future date: "Cannot log future workouts"
    - Weight ≤0: "Weight must be greater than 0"
    - Reps ≤0: "Reps must be greater than 0"
  - Verify all error messages display next to the invalid field

- [ ] T018 [P] Test responsive layout at key viewports:
  - **Mobile (iPhone SE, 375×667)**:
    - Form inputs stack vertically
    - Buttons are ≥44×44px and tappable
    - Table: may hide Set3-Set5 columns, no horizontal scroll
  - **Tablet (iPad, 768×1024)**:
    - Form and table layout is comfortable
    - All columns visible or easily accessible
  - **Desktop (1280×800)**:
    - Full table with all columns
    - Form is compact
  - Use browser DevTools device emulation to test

- [ ] T019 [P] Test data persistence across app reload:
  - Log a workout
  - Close DevTools
  - Reload page (Cmd+R / Ctrl+R)
  - Verify workout still visible in table
  - Close entire browser tab and reopen PWA (if installed)
  - Verify data persists (tests PWA offline storage)

- [ ] T020 Test complete workflow end-to-end:
  - Clear app data (reset SQLite in DevTools)
  - Log Workout 1: "Squats", 2026-05-17, Set1: 100kg, 5 reps; Set2: 110kg, 3 reps
  - Log Workout 2: "Bench Press", 2026-05-18, Set1: 60kg, 10 reps
  - View table: both visible, Workout 2 first (most recent)
  - Edit Workout 1: add Set3: 90kg, 8 reps
  - Verify table updates
  - Delete Workout 2: confirm dialog, then delete
  - Verify Workout 1 remains, Workout 2 gone
  - Reload app
  - Verify final state persists
  - Reference: Full acceptance scenarios from `spec.md` User Stories 1-3

---

## Test Checklist (Manual)

These tests should be performed before marking the feature complete:

- [ ] **T021** Can log a new workout with 1-5 sets (US1 workflow)
- [ ] **T022** Workouts persist after app reload (US1 persistence)
- [ ] **T023** View all logged workouts in table, sorted most recent first (US2 workflow)
- [ ] **T024** Each set shows weight (kg) and reps clearly (US2 display)
- [ ] **T025** Edit a workout: modify exercise, date, or set details (US3 workflow)
- [ ] **T026** Delete a workout with confirmation dialog (US3 workflow)
- [ ] **T027** Validation prevents saving workouts without sets (FR-011)
- [ ] **T028** Validation prevents future dates (FR-012)
- [ ] **T029** Validation prevents weight ≤0 or reps ≤0 (FR-007, FR-008)
- [ ] **T030** Cannot add more than 5 sets (FR-010)
- [ ] **T031** Form is usable on mobile (≥320px viewport) without horizontal scroll
- [ ] **T032** Table is usable on mobile without excessive horizontal scroll
- [ ] **T033** Touch targets are ≥44×44px (buttons, inputs)
- [ ] **T034** Works offline: log workout, reload in offline mode, data visible

---

## Task Dependencies & Execution Order

```
Phase 1 (Database Setup)
├─ T001: workout_log table schema
├─ T002: workout_set table schema [P with T001]
└─ T003: Database helper functions [P with T001/T002]

Phase 2 (US1: Log Workout)
├─ T004: WorkoutForm component (depends on T003)
├─ T005: Form save logic (depends on T004)
├─ T006: Integrate form into table (depends on T005)
└─ T007: Test US1 (depends on T006)

Phase 3 (US2: View History)
├─ T008: WorkoutTable component (depends on T003)
├─ T009: Table rendering (depends on T008)
├─ T010: Responsive layout (depends on T009)
└─ T011: Test US2 (depends on T010)

Phase 4 (US3: Edit/Delete)
├─ T012: Edit button (depends on T008, T003)
├─ T013: Delete button (depends on T008, T003)
├─ T014: Form edit mode (depends on T004)
└─ T015: Test US3 (depends on T012-T014)

Phase 5 (Polish & Integration)
├─ T016: Mount in App.tsx (depends on T008)
├─ T017: Validate form errors [P with others]
├─ T018: Test responsive layout [P with T017]
├─ T019: Test persistence [P with T018]
├─ T020: Full end-to-end workflow (depends on T017-T019)
└─ T021-T034: Final test checklist
```

**Critical Path**: T001 → T003 → T004/T005 → T006 → T008/T009 → T012/T013 → T016 → T020

**Parallel Opportunities**:
- T002 with T001 (both schema creation)
- T003 can start once T001/T002 complete
- T008/T009 can develop in parallel with T004/T005 (both depend on T003)
- T012/T013 can develop in parallel
- T017, T018, T019 can run in parallel during final polish

---

## Success Criteria

Feature is complete when:

1. ✅ All tasks T001-T016 are completed
2. ✅ Manual test checklist (T021-T034) all pass
3. ✅ Constitution principles verified (per plan.md Constitution Check)
4. ✅ All workouts persist to SQLite via OPFS
5. ✅ Table displays with most recent workout first
6. ✅ Form validates minimum 1 set, past/current dates only
7. ✅ Responsive layout at ≥320px without horizontal scroll
8. ✅ Users can complete logging workflow in under 2 minutes (SC-001)
9. ✅ 95% success rate on first attempt (estimated via manual testing)

---

## Notes

- **No test runner configured** per Constitution Principle V — all testing is manual
- **Container vs. Presentational Components** (Constitution Principle VII):
  - Containers: `WorkoutForm` (state, validation, save logic), `WorkoutTable` (state, data fetching, edit/delete)
  - Presentational: Reusable form inputs, table cells, buttons (UI-only, no logic)
- **Database helpers** follow existing `src/database.ts` patterns (parameterized SQL, `dbId`, memoized `initDatabase`)
- **Lint and typecheck MUST pass before commit** (per CLAUDE.md Development Workflow)
