# Quickstart: Workout UI Polish

## What this feature does

Nine targeted UI improvements to the workout log screen:

1. Set column headers become green numbered icons (both grouped and advanced tables)
2. "Advanced" button moves into the actions column header of the grouped table
3. Inline Edit/Delete buttons → single vertical three-dot menu (both tables)
4. Exercise text names → exercise image thumbnails in the grouped table
5. Set values display as `80×5` (no "kg", 12px font, 10px H-padding)
6. Advanced view gains extra top padding for iPhone notch safety
7. Advanced view loses the fullscreen toggle (already fullscreen)
8. Advanced view loses the "Add Workout" toolbar button
9. Add/Edit form appears in a bottom drawer instead of a centred modal

## Files touched

| File | Change |
|------|--------|
| `src/db/entities/workout-log/types.ts` | Add `exercise_image_filename: null \| string` to `WorkoutTableRow` |
| `src/db/entities/workout-log/repository.ts` | JOIN exercise table in pivot query |
| `src/routes/workouts/WorkoutSetRow.tsx` | `formatSetCell` — remove "kg"/spaces; icon `color="secondary"` |
| `src/routes/workouts/WorkoutRowActions.tsx` → `WorkoutRowActions/index.tsx` | Convert to three-dot menu; move to folder |
| `src/routes/workouts/GroupedWorkoutTable/index.tsx` | Icon headers, exercise image col, Advanced in header, 10px padding, 12px font |
| `src/routes/workouts/AdvancedWorkoutTable/index.tsx` | Remove Add Workout, disable fullscreen, add top padding, pass new `onAdvanced` removed |
| `src/routes/workouts/views/WorkoutsView.tsx` | Remove Advanced button row, replace FormDialog with SwipeableDrawer, remove `onAdd` from AdvancedWorkoutTable |

## Key constraints

- No schema migrations — only a query change (LEFT JOIN exercise).
- `WorkoutForm` internals are unchanged.
- `WorkoutRowActions` props (`onEdit`, `onDelete`) are unchanged — callers need no update beyond the import path change (folder).
- `GroupedWorkoutTable` gains one new prop: `onAdvanced: () => void`.

## Testing checklist

- [ ] Grouped table: header shows 5 green icons, no text "Set N"
- [ ] Grouped table: exercise column shows image (or dumbbell placeholder if no image)
- [ ] Grouped table: set value is `80×5` format (no kg, no spaces)
- [ ] Grouped table: "Advanced" button in last column header opens advanced view
- [ ] Grouped table: three-dot icon opens Edit/Delete menu per row
- [ ] Advanced table: no "Add Workout" button in toolbar
- [ ] Advanced table: no fullscreen toggle
- [ ] Advanced table: set icons are green in headers
- [ ] Advanced table: three-dot menu works for Edit/Delete
- [ ] Advanced table: top padding clears notch on iPhone (test in browser with safe-area simulation)
- [ ] FAB opens bottom drawer (slides from bottom, not centred modal)
- [ ] Drawer: natural height for short form, scrollable when keyboard open
- [ ] Drawer: swipe-down or backdrop tap dismisses without save
- [ ] Lint + typecheck pass: `npm run lint && npm run typecheck`
