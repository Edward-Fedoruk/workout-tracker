# Research: Workout UI Polish

## Decision 1 — Exercise image in WorkoutTableRow

**Decision**: Extend the existing pivot SQL query in `workoutLogRepository.list()` to LEFT JOIN the `exercise` table and select `e.image_filename AS exercise_image_filename`. Update `WorkoutTableRow` to add `exercise_image_filename: null | string`.

**Rationale**: The exercise entity already stores `image_filename` (added in feature 013). The URL pattern is `${import.meta.env.BASE_URL}exercises/${imageFilename}`. The current pivot query only touches `workout_log` and `workout_set`; a single LEFT JOIN on `exercise.name = workout_log.exercise_name` adds the image with no schema change. This is the cleanest path — no client-side lookup, no extra query.

**Alternatives considered**:
- Pass the full `exercises` list into `GroupedWorkoutTable` and look up by name client-side. Rejected: requires prop drilling exercises into the table, and the image lookup by name would need a Map/dictionary, adding unnecessary complexity.
- Separate `listWorkoutImages()` query merged into `useWorkouts`. Rejected: waterfall fetch; unnecessary given the JOIN approach.

---

## Decision 2 — Set icon green colour token

**Decision**: Use `color="secondary"` on the set icons (LooksOne–Looks5) in both tables.

**Rationale**: The MUI theme defines `secondary.main = token.emerald400`, which is the brand green used throughout the app (FAB, date group label). `primary.main` is the "bright" accent used for action buttons — using `secondary` is consistent with the existing accent-green visual language.

**Alternatives considered**:
- `color="primary"`: Also green (emerald600/bright), but heavier — used for contained action buttons. Rejected in favour of the softer secondary.
- Custom `sx={{ color: 'custom-hex' }}`: Rejected; breaking out of the theme would create an unmaintained magic value.

---

## Decision 3 — Bottom drawer component

**Decision**: Replace `FormDialog` (which wraps MUI `Dialog`) with MUI `SwipeableDrawer` anchored to `"bottom"`. Apply `sx={{ '& .MuiDrawer-paper': { maxHeight: '90dvh', borderRadius: '12px 12px 0 0', overflowY: 'auto' } }}` to achieve content-driven height capped at 90% of the dynamic viewport height, with internal scroll.

**Rationale**: `SwipeableDrawer` gives native swipe-to-dismiss for free on touch devices. `maxHeight: '90dvh'` (dynamic viewport units, falls back gracefully) caps the sheet below the status bar on iPhone while letting shorter forms sit at their natural height. `overflowY: 'auto'` on the paper element enables internal scroll when the keyboard is open.

**Alternatives considered**:
- Fixed `height: '90dvh'`: Rejected (User Story 5 clarification chose content-driven, not fixed).
- Full-screen `Dialog` kept as-is: Rejected (conflicts with the spec requirement for a bottom drawer).
- Third-party sheet library (e.g., `react-spring-bottom-sheet`): Rejected; no additional dependency needed when MUI's own `SwipeableDrawer` satisfies all requirements.

---

## Decision 4 — Three-dot contextual action menu

**Decision**: Refactor `WorkoutRowActions` from a flat file (`WorkoutRowActions.tsx`) to a folder-based component (`WorkoutRowActions/index.tsx`) per Constitution Principle VIII. The component uses MUI `IconButton` with `MoreVertIcon`, anchored `Menu`, and two `MenuItem` entries ("Edit", "Delete"). State for the menu anchor is managed locally within the component via `useState`.

**Rationale**: Both the grouped table and the advanced view use the same `WorkoutRowActions` component, so a single update covers both. Moving to a folder satisfies the folder-by-entity rule from Principle VIII. Local anchor state avoids lifting purely UI state into the parent.

**Alternatives considered**:
- Separate menu components per view: Rejected; the actions are identical in both views.
- MUI `SpeedDial`: Rejected; overkill for two fixed actions.

---

## Decision 5 — Advanced table top padding (iPhone safe area)

**Decision**: Wrap `AdvancedWorkoutTable` in a `Box` with `pt: 'max(env(safe-area-inset-top), 16px)'`. This uses the CSS environment variable for the device safe-area inset and falls back to 16px on non-notch devices.

**Rationale**: The advanced view is a full-screen `Dialog`. On iPhone with a notch, the table content can start behind the notch unless padding accounts for `env(safe-area-inset-top)`. The AppBar already occupies its natural position; this padding is applied to the content area below it.

**Alternatives considered**:
- MUI `Toolbar` spacer below AppBar: Would only handle the AppBar height, not the safe-area inset-top.
- `paddingTop: 'safe-area-inset-top'` CSS custom property alone without fallback: Rejected; older iOS/Android may not support it, and `max()` with a fallback is safer.

---

## Decision 6 — Disable advanced table fullscreen toggle and Add Workout button

**Decision**: Set `enableFullScreenToggle: false` in the `useMaterialReactTable` config. Remove the `renderTopToolbarCustomActions` prop entirely (removing the "Add Workout" button).

**Rationale**: Both are single-line config changes to MaterialReactTable. The fullscreen toggle is meaningless when the view is already rendered inside a full-screen `Dialog`. The "Add Workout" button is redundant — the FAB on the main screen is the sole entry point for creating workouts (per spec).

---

## Decision 7 — Set cell formatting

**Decision**: Update `formatSetCell` in `WorkoutSetRow.tsx` to return `${weight}×${reps}` (no "kg", no spaces around "×"). For reps-only: `×${reps}`. For weight-only: `${weight}`.

**Rationale**: Directly implements FR-005. The function is the single source of truth for set display in both views — changing it here propagates everywhere.

**Alternatives considered**:
- Override per-table with a custom cell renderer: Rejected; the spec requires the format in both views, so a shared function change is cleaner.
