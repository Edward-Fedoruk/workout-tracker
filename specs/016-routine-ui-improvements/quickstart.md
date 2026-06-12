# Quickstart: Routine UI Improvements

## What this feature changes

Two surfaces: the **Routine List** page and the **Routine Workout** view. No new routes, no schema migrations, no new DB tables.

## Files touched

### Data layer
| File | Change |
|------|--------|
| `src/db/entities/routine-workout-draft/types.ts` | Add `completed?: boolean` to `StoredSetValues` element type |
| `src/db/entities/routine-exercise/repository.ts` | Extend `getLastSets` with per-position fallback query |

### Routine List surface
| File | Change |
|------|--------|
| `src/routes/routines/RoutineCard.tsx` | Remove Edit/Delete buttons; add green Start button next to title; replace exercise count chip with exercise name chips |
| `src/routes/routines/RoutineList/views/RoutineListView.tsx` | Title h5→h6; remove "Add Routine" Button; add FAB; remove onEdit/onDelete props |
| `src/routes/routines/RoutineList/hooks/useRoutines.ts` | Move delete confirm logic to RoutineEditor hook |

### Routine Editor surface
| File | Change |
|------|--------|
| `src/routes/routines/RoutineEditor/views/RoutineEditorView.tsx` | Add MoreVertIcon menu with Edit name + Delete |
| `src/routes/routines/RoutineEditor/hooks/useRoutineEditor.ts` | Add delete + edit-name handlers (moved from useRoutines) |

### Routine Workout surface
| File | Change |
|------|--------|
| `src/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema.ts` | Add `completed: z.boolean().default(false)` to set schema |
| `src/routes/routines/RoutineWorkout/views/RoutineWorkoutExercise.tsx` | Avatar left of name; Looks* set icons; "kg" label; Checkbox per set; green row bg |
| `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx` | Pass `allSetsCompleted` to disable Log Workout button |
| `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts` | Restore `completed` from draft; serialise `completed` in autoSave; inject prefill as defaultValues |

## Key implementation order

1. **Type extension** (`StoredSetValues`) — all other changes depend on this.
2. **`getLastSets` fallback** — needed before workout view defaultValues wiring.
3. **Form schema** (`completed` field) — needed before checkbox wiring.
4. **`RoutineWorkoutExercise`** — icons, avatar, label, checkbox, green row.
5. **`RoutineWorkoutView`** — `allSetsCompleted` gate.
6. **`useRoutineWorkout`** — prefill defaultValues + autoSave completed.
7. **`RoutineCard`** — exercise chips + Start button + remove Edit/Delete.
8. **`RoutineListView`** — FAB + title size.
9. **`RoutineEditorView`** — three-dots menu + delete/edit-name handlers.
10. **`useRoutineEditor`** — delete + name-edit moved here.

## Testing the feature manually

1. `npm run dev`
2. Open Routines list — verify: h6 title, FAB bottom-right, cards show exercise chips, green Start button, no Edit/Delete on card.
3. Open a routine (pencil/editor) — verify three-dots ⋮ menu has Edit name + Delete.
4. Start a routine workout:
   - Verify exercise avatar left of name.
   - Verify set rows show `LooksOneIcon` etc. instead of "Set N" text.
   - Verify weight field label is "kg".
   - Verify inputs are pre-filled with last workout values (not just placeholder).
   - Check a set — row turns green.
   - Verify Log Workout button disabled until all sets checked.
   - Reload page — verify checked state and values persist.
5. Log the workout — verify it saves normally.
