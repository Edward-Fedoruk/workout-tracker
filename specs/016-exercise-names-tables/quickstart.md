# Quickstart: Exercise Names in Tables

**Branch**: `016-exercise-names-tables` | **Date**: 2026-06-12

## What this feature does

Adds a toggle in Settings ("Exercise Names in Tables") that swaps the exercise avatar column in the Workout Log table for a text column showing exercise names. The Individual Exercise page's log table always shows names (no toggle required — the avatar is redundant there).

## Files changed (summary)

| File | Change |
|------|--------|
| `src/db/entities/app-setting/repository.ts` | Add `getExerciseNamesInTables()` + `setExerciseNamesInTables()` |
| `src/database.ts` | Export the two new methods |
| `src/routes/workouts/GroupedWorkoutTable/index.tsx` | Replace `showExerciseNames` with `firstColumn: 'avatar' \| 'name' \| 'none'`; render accordingly |
| `src/routes/workouts/hooks/useWorkouts.ts` | Load setting; return `exerciseNamesInTables` |
| `src/routes/workouts/views/WorkoutsView.tsx` | Pass `firstColumn={exerciseNamesInTables ? 'name' : 'avatar'}` |
| `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx` | Pass `firstColumn="none"` (no identity column) |
| `src/routes/settings/hooks/useDisplaySettings.ts` | **New** — load/toggle the preference |
| `src/routes/settings/views/SettingsView.tsx` | Add Display section + Switch |
| `src/routes/settings/index.tsx` | Wire `useDisplaySettings`; pass to view |

## No migration needed

The `app_setting` table already exists. The new key `exercise_names_in_tables` is written on first toggle; an absent row is treated as `false`.

## Step-by-step implementation order

1. **Repository** — add the two methods to `AppSettingRepository` and export from `database.ts`.
2. **GroupedWorkoutTable** — add `firstColumn: 'avatar' | 'name' | 'none'` prop; update the first column render accordingly.
3. **useWorkouts** — load `getExerciseNamesInTables()` in the `refresh()` call; surface as `exerciseNamesInTables`.
4. **WorkoutsView** — pass `exerciseNamesInTables` down to `GroupedWorkoutTable`.
5. **ExerciseDetailView** — hardcode `firstColumn="none"` on its `GroupedWorkoutTable` (no identity column on the exercise detail page).
6. **useDisplaySettings** — new hook: load on mount, expose `toggle()`.
7. **SettingsView + Settings container** — add Display section with the Switch.

## Verification checklist

- [ ] Settings page shows "Exercise Names in Tables" toggle, default off.
- [ ] Toggle on → Workout Log immediately shows names (120 px column, ellipsis on overflow).
- [ ] Toggle off → Workout Log shows avatars again.
- [ ] Reload app with toggle on → still on.
- [ ] Exercise Detail page log table shows no identity column (no avatar, no name), regardless of toggle.
- [ ] Very long exercise name → truncated with ellipsis, no layout overflow.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
