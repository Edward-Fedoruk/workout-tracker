# Research: Exercise Detail Page

## Decision 1: Exercise-to-workout-log join strategy

**Decision**: Filter `workout_log` by `exercise_name` (string match), not by a foreign key ID.

**Rationale**: The `workout_log` table stores `exercise_name` as a denormalized string — there is no `exercise_id` FK column. The `exercise.update()` method already propagates name changes to `workout_log`, so the name is the stable join key in this data model. No schema change is needed.

**Alternatives considered**: Adding an `exercise_id` FK to `workout_log` would require a migration and backfill. Out of scope; additive-only schema changes per Constitution Principle III.

---

## Decision 2: Exercise lookup on detail page

**Decision**: Route `/exercises/:id` receives `exercise.id` as a URL param. The `ExerciseDetail` container fetches the exercise record via a new `getExerciseById(id)` DB helper, then uses its `name` to fetch workout history via `listWorkoutsByExerciseName(name)`.

**Rationale**: The `ExerciseList` already has `Exercise` objects with `id`; passing the ID in the URL is the standard SPA pattern and avoids passing state through navigation. The double fetch (exercise then history) is a single-user local SQLite app — no latency concern.

**Alternatives considered**: Passing the full exercise object via router state is fragile (lost on reload) and couples the list to the detail page.

---

## Decision 3: Simplified log component for history

**Decision**: Reuse `GroupedWorkoutTable` with `onDelete` and `onEdit` made optional. When both are absent, the action column is not rendered.

**Rationale**: `GroupedWorkoutTable` is the simpler of the two table components (vs. `AdvancedWorkoutTable` which adds material-react-table). Making the action props optional adds one conditional and keeps the component generic. The exercise detail page shows read-only history per the spec.

**Alternatives considered**: Building a separate read-only table component would duplicate the date-grouping and cell-formatting logic with no benefit.

---

## Decision 4: Edit/delete entry point on detail page

**Decision**: Three-dots (`MoreVertIcon`) menu button in the top-right of the detail page header. Clicking it opens an MUI `Menu` with "Edit" and "Delete" items. Edit opens the existing `ExerciseForm` dialog (pre-filled); Delete opens the existing `ConfirmDialog`. Both dialogs reuse the exact same components and logic already in `useExercises`.

**Rationale**: Matches the spec and preserves existing business logic unchanged. MUI `Menu` + `IconButton` is the established pattern in the codebase for contextual actions.

**Alternatives considered**: Drawer or bottom sheet — heavier, not necessary for two items.

---

## Decision 5: Routine-to-exercise navigation

**Decision**: In `RoutineEditorView`, make the exercise name text in `ExerciseRow` a tappable `ButtonBase` (or `Typography` component prop `component="button"`) that calls `onNavigateToExercise?.(exercise.id)`. The `RoutineEditorView` already receives `libraryExercises: Exercise[]` so it can look up the ID by `exerciseName` when calling `useNavigate`.

**Rationale**: `ExerciseRow` is a presentational component — adding an optional callback prop keeps the pattern consistent. Navigation logic stays in the view layer (knows about router), not the presentational `ExerciseRow`.

**Alternatives considered**: Navigating by exercise name via query param (`/exercises?name=X`) — would require extra lookup on the detail page and is less idiomatic than route params by ID.

---

## Decision 6: `useExercises` scope reduction

**Decision**: The `useExercises` hook retains only create-related state (`openCreate`, `handleSave`, `dialog`, `dialogMode = 'create'`). Edit/delete state (`openEdit`, `requestDelete`, `pendingDelete`, `deleteConfirm`, `confirmDelete`, `cancelDelete`, `editingExercise`) moves into the new `useExerciseDetail` hook on the detail page.

**Rationale**: Edit and delete now live on the detail page; keeping dead edit/delete state in `useExercises` violates Constitution Principle V (no abstractions beyond what the task requires).

**Alternatives considered**: Keeping `useExercises` unchanged and ignoring the dead state — creates misleading dead code.

---

## Decision 7: No schema migration

**Decision**: No new tables, columns, or migrations are needed.

**Rationale**: All data (exercise attributes, workout history) is already present in existing tables. The only new DB operations are filtered reads: `getById` and `listByExerciseName` — both additive, parameterized queries.
