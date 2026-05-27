# Quickstart: Workout Routines Feature

## Prerequisites

- Existing app builds and runs (`npm run dev`)
- `drizzle-kit` available (`npx drizzle-kit generate`)

---

## Step 1 — Add DB schema

Edit `src/db/schema.ts`: add `routine` and `routine_exercise` table definitions (see `data-model.md` for the exact Drizzle schema). Import `check`, `unique` from `drizzle-orm/sqlite-core` (already imported for `workoutSet`).

Then generate the migration:
```bash
npx drizzle-kit generate
```

This writes a new `.sql` file under `drizzle/`. Commit both `src/db/schema.ts` and the generated SQL file together.

---

## Step 2 — Add DB helpers

Add to `src/database.ts`:

1. Import `routine`, `routineExercise` from `./db/schema`.
2. Export `Routine`, `RoutineExercise`, `RoutineWithExercises`, `LastExerciseSets` types.
3. Implement each helper from `contracts/database.ts.md` in order:
   - `listRoutines` — two Drizzle selects, grouped in JS
   - `getRoutineById` — two Drizzle selects
   - `createRoutine` / `updateRoutine` / `deleteRoutine`
   - `addRoutineExercise` — append at max+1 position
   - `updateRoutineExercise`
   - `deleteRoutineExercise` — delete + re-index in `BEGIN`/`COMMIT`
   - `moveRoutineExercise` — swap positions in `BEGIN`/`COMMIT`
   - `getLastExerciseSets` — raw SQL (see contract for query)

**Note**: `database.ts` approaches the 200-line soft limit — extract helpers to `src/db/routineHelpers.ts` if the file exceeds ~200 lines, and re-export from `database.ts`.

---

## Step 3 — Navigation state in App.tsx

Replace the current `isDatabaseReady ? <WorkoutTable /> : <Box>Loading...</Box>` render with:

```tsx
type ActiveView =
  | { type: 'log' }
  | { type: 'routines' }
  | { type: 'edit-routine'; routineId: number | null }
  | { type: 'start-routine'; routineId: number };
```

State: `const [activeView, setActiveView] = useState<ActiveView>({ type: 'log' })`.

Layout:
- When `activeView.type` is `'log'` or `'routines'`: render `<AppBar>` with MUI `<Tabs>` (Log | Routines) + the active tab's content below.
- When `activeView.type` is `'edit-routine'` or `'start-routine'`: render just the full-page component (no tab bar).

---

## Step 4 — Routines tab components

Build in this order (each depends on the previous):

1. **`src/components/routines/routineUtils.ts`** — pure helpers: `validateRoutineName(name)`, `validateExercise(name, sets, reps)`.
2. **`src/components/routines/RoutineCard.tsx`** — presentational; props: `routine: RoutineWithExercises`, `onEdit`, `onDelete`, `onStart`. Shows name, exercise count chip, three action buttons.
3. **`src/components/routines/RoutineList.tsx`** — container; fetches `listRoutines()`, renders a list of `RoutineCard` + "Add Routine" button + confirm-delete dialog.
4. **`src/components/routines/ExerciseRow.tsx`** — presentational; props: `exercise`, `isFirst`, `isLast`, `onMoveUp`, `onMoveDown`, `onEdit`, `onDelete`.
5. **`src/components/routines/RoutineEditor.tsx`** — container (full-page); receives `routineId: number | null` and `onBack: () => void`. Handles create/edit routine name and exercises list (add / edit inline / delete / reorder).
6. **`src/components/routines/RoutineWorkoutExercise.tsx`** — presentational; receives exercise template + pre-filled set rows; calls back with updated set values.
7. **`src/components/routines/RoutineWorkoutForm.tsx`** — container (full-page); receives `routineId` and `onBack`. Fetches routine + pre-fills sets via `getLastExerciseSets`. On submit, calls `createWorkout` for each filled-in exercise in sequence.

---

## Step 5 — Wire everything in App.tsx

Pass `setActiveView` (or a derived callback) down to:
- `RoutineList` → `onEdit` navigates to `edit-routine`, `onStart` navigates to `start-routine`.
- `RoutineEditor` → `onBack` navigates to `routines`.
- `RoutineWorkoutForm` → `onBack` navigates to `routines`.

---

## Verify

```bash
npm run typecheck   # must pass
npm run lint        # must pass
npm run dev         # smoke test in browser
```

Manual golden path:
1. Open app → "Routines" tab visible alongside "Log".
2. Create routine "Push Day" with 3 exercises, verify reorder with ↑/↓ arrows, save.
3. Delete one exercise, verify re-index (order preserved).
4. Tap "Start" → pre-fill placeholders appear for any previously logged exercises.
5. Fill in weights/reps, submit → verify entries in "Log" tab.
6. Edit routine name → verify log entries unchanged.
7. Delete routine → verify it disappears from the list.
