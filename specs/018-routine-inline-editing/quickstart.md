# Quickstart: Routine Inline Editing & UI Consistency

## Prerequisites

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

No schema migration — do **not** run `drizzle-kit generate`.

## Build order

1. **DB layer**: add `reorder()` + `updateSetCount()` to
   `src/db/entities/routine-exercise/repository.ts`; export `reorderRoutineExercises` and
   `setRoutineExerciseSetCount` from `src/database.ts`.
2. **Form util**: extract `buildFormValues(routine, draftData, prefills, exercises)` (the current inline
   defaultValues logic in `RoutineWorkoutView.tsx`) into `RoutineWorkout/buildFormValues.ts`.
3. **Structure hook**: add `RoutineWorkout/hooks/useRoutineStructure.ts` (autosave→mutate→reload→bump).
   Extend `useRoutineWorkout` to expose `reload(routineId)` and an awaitable draft save.
4. **Set row + card**: extract `RoutineWorkoutSetRow.tsx`; build `RoutineExerciseCard/index.tsx` (card,
   green-when-complete, alternating gray, three-dots menu, +/− set outlined buttons, drag handle).
5. **Merged view**: update `RoutineWorkoutView.tsx` — `DndContext`/`SortableContext`, rename header,
   add-exercise dialog, `reset()` on `structureVersion`. Wire callbacks in `RoutineWorkout/index.tsx`.
6. **Routing**: in `src/router.tsx` remove `/routines/new` and `/routines/:id/edit`; serve the merged
   view at `/routines/:id`. Delete `RoutineEditor/` and `ExerciseRow.tsx`.
7. **Routine list**: `+` creates a routine (default name) and navigates to `/routines/<id>`; row tap opens
   the merged view; routine delete via row three-dots. Update `useRoutines`, `RoutineListView`, `RoutineCard`.
8. **Add FAB consistency**: lift a single `Fab` into `ExerciseLibraryView`; remove the two top "Add …"
   buttons in the subviews; switch the action by active tab in the container.

## Manual verification (run `npm run dev`)

**US1 — inline editing**
1. Routines → `+`: a routine is created and opens immediately; rename it via the pencil → name persists.
2. Add an exercise (add dialog) → it appears; reopen routine → still there.
3. `+ Set` adds a row (stops at 5); `− Set` removes the trailing row (stops at 1) → reopen → counts persist.
4. Three-dots → Edit → change rep range → target label updates and persists.
5. Three-dots → Delete (confirm) → exercise removed; remaining order stays 1..N.
6. Enter weights/reps, check all sets, **Log Workout** → lands on /log with the workout saved.

**US2 — drag reorder**
7. With 3+ exercises, drag a card by its handle to a new spot → order changes; reopen → persists; any
   already-entered set values stay with their exercises. Verify drag works by touch (mobile emulation).

**US3 — cards**
8. Each exercise is a card; set rows alternate gray; completing all sets turns the whole card green;
   un-checking a set reverts it.

**US4 — add buttons**
9. Exercise Library: both tabs add via the bottom-right plus FAB (matching log/routine screens); the FAB's
   action matches the active tab. No top "Add …" buttons remain.

## Gates before commit

```bash
npm run lint
npm run typecheck
npm run build      # tsc -b + vite build
```

(Stop-hook enforces lint + typecheck. No test runner — Principle V.)
