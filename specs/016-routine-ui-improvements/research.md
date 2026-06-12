# Research: Routine UI Improvements

## Decision 1: Prefill strategy — defaultValues vs. setValue after mount

**Decision**: Use `defaultValues` in `useForm` with actual prefill values (not just placeholders).

**Rationale**: The current implementation already uses `defaultValues` for saved draft data. Prefill from `LastExerciseSets` should follow the same pattern — merge prefill into `defaultValues` so the form is ready on first render without a second pass. This avoids a `useEffect` + `setValue` loop which can cause a visible flash and is harder to reason about with `react-hook-form`.

**Alternatives considered**:
- `setValue` in a `useEffect` after mount — introduces render timing complexity and can conflict with draft restoration.
- `placeholder` only — current behaviour; rejected per spec (FR-009 requires real values).

---

## Decision 2: Prefill fallback — walk backwards logic

**Decision**: Enhance `getLastSets` (or add a new `getLastSetsWithFallback`) in `RoutineExerciseRepository` to walk backwards through previous workouts per set position when the most recent workout has a null at that position.

**Rationale**: The current `getLastSets` query fetches all sets from the single most recent workout. A null set position in that workout means we get `null` for that slot — there is no fallback. A second query per-position (or a lateral join approach) is needed to fill gaps. Given SQLite's limitations with lateral joins, the simplest correct approach is: after the primary query, for each position with a null weight/reps, run a second query to find the most recent non-null value at that position from any earlier workout.

**Alternatives considered**:
- Single complex SQL with `COALESCE` over multiple ordered rows — possible but hard to maintain and test.
- In-memory scan of full workout history — too expensive and wasteful.
- Keep current placeholder behaviour — rejected per spec.

---

## Decision 3: Completion state storage — extend StoredSetValues

**Decision**: Extend the per-set type `{ weight, reps }` with `completed: boolean`. The `StoredDraftData` JSON blob stored in `routine_workout_draft.draft_data` naturally accommodates this additive field. Old drafts without `completed` will deserialise with `undefined`, treated as `false`.

**Rationale**: `StoredDraftData` is already a freeform JSON column. Adding a field is backward-compatible and requires no migration. The draft is a singleton (at most one row) so there is no data sprawl concern.

**Alternatives considered**:
- Separate DB column for completion state — unnecessary complexity; draft is ephemeral.
- React state only (no persistence) — rejected per FR-013.

---

## Decision 4: Set completion gate on Log Workout button

**Decision**: Compute `allSetsCompleted` from the live `watch()` value of the form (or equivalent controlled state), and pass it as a `disabled` prop to the Log Workout button.

**Rationale**: The form already tracks all values reactively. Watching the `exercises[*].sets[*].completed` fields gives a synchronous truth value without needing separate state. Auto-save fires on blur/change for completed flags just as it does for weight/reps.

**Alternatives considered**:
- Separate `useState` array for completion — doubles state and risks drift with form state.
- Server-side validation — N/A, local-first app.

---

## Decision 5: Three-dots menu in RoutineEditor — follow ExerciseDetailView pattern exactly

**Decision**: Add a `MoreVertIcon` `IconButton` in the `RoutineEditorView` header (top-right). Clicking opens a MUI `Menu` with "Edit name" and "Delete" `MenuItem`s. "Edit name" opens the existing `RoutineNameForm` modal. "Delete" triggers the existing `ConfirmDialog`.

**Rationale**: `ExerciseDetailView` already implements this exact pattern (`menuAnchor` state, `Menu`, `MenuItem`). Reusing the same approach keeps the codebase consistent and avoids inventing a new UX pattern.

**Alternatives considered**:
- Inline Edit/Delete buttons in the header — current list-card pattern being removed; not appropriate for a detail view.
- Swipeable drawer for actions — overkill for two actions.

---

## Decision 6: Exercise avatar in RoutineWorkoutExercise — reuse ExerciseList Avatar pattern

**Decision**: Render a MUI `Avatar` (56×56, same as ExerciseList) to the left of the exercise name in each exercise section header. Source image from `${import.meta.env.BASE_URL}exercises/${exercise.imageFilename}` when available; fall back to `<FitnessCenterIcon />`. The `exercise` object (`RoutineExercise`) does not carry `imageFilename`, so `RoutineWorkoutExercise` must receive it as an additional prop sourced from the matched `Exercise` in the library list (already fetched in `useRoutineWorkout`).

**Rationale**: The exercise image filename is available in `Exercise` (library), and the hook already fetches `listExercises()`. A simple lookup by name at render time (or a pre-built map in the hook) avoids any new DB queries.

**Alternatives considered**:
- Fetching image per exercise in the workout hook — redundant, library list already loaded.
- Adding `imageFilename` to `RoutineExercise` DB type — unnecessary; it's a display concern.

---

## Decision 7: FAB button on Routines list — exact WorkoutsView positioning

**Decision**: Replace the `<Button onClick={onAdd}>Add Routine</Button>` in `RoutineListView` with a `<Fab color="secondary" sx={{ bottom: 80, position: 'fixed', right: 24 }}>` + `<AddIcon />`, identical to `WorkoutsView`.

**Rationale**: Direct copy of the existing FAB ensures pixel-level consistency. `color="secondary"` matches the log screen FAB.

---

## Decision 8: Exercise tag list on RoutineCard — MUI Chip with flexWrap

**Decision**: Replace the single "X exercises" `Chip` with a `Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}` containing one `Chip` per exercise name (size="small"). On overflow, chips wrap to additional lines.

**Rationale**: MUI `Chip` is already used for exercise counts and muscle groups throughout the app. `flexWrap` ensures graceful multi-line layout on narrow screens (Principle VI).
