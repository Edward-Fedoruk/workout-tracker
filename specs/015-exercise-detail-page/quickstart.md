# Quickstart: Exercise Detail Page

## Overview

This feature adds an individual exercise detail page at `/exercises/:id`, cleans up the exercise library list, and makes exercise names tappable from the routine editor. No database migrations are needed.

## Prerequisites

- Working knowledge of React Router DOM (`useParams`, `useNavigate`)
- Familiar with the existing exercise library structure in `src/routes/exercises/`

## Implementation order

Follow this order to avoid broken intermediate states:

### Step 1 — New DB helpers

Add `getById` to `exerciseRepository` and `listByExerciseName` to `workoutLogRepository`, then export both from `database.ts`. This step has no UI changes and can be verified by running `npm run typecheck`.

**Files**: `src/db/entities/exercise/repository.ts`, `src/db/entities/workout-log/repository.ts`, `src/database.ts`

### Step 2 — GroupedWorkoutTable: make actions optional

Make `onDelete` and `onEdit` optional props. When absent, omit the action column. This is a backward-compatible change; existing callers still pass both.

**File**: `src/routes/workouts/GroupedWorkoutTable/index.tsx`

### Step 3 — ExerciseDetail component (new route)

Create the container, hook, and view for `ExerciseDetail`. Add the `/exercises/:id` route to `router.tsx`. At this point the page is reachable by typing the URL directly.

**Files**:
- `src/routes/exercises/Exercise/ExerciseDetail/index.tsx`
- `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts`
- `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx`
- `src/router.tsx`

### Step 4 — ExerciseList: remove buttons, add navigation

Strip the `onEdit`/`onDelete` props and secondary actions from `ExerciseList`. Add `onNavigate` prop and make each row tappable.

**File**: `src/routes/exercises/Exercise/ExerciseList/index.tsx`

### Step 5 — useExercises: trim edit/delete state

Remove edit/delete state from the hook since it now lives on the detail page.

**File**: `src/routes/exercises/ExerciseLibrary/hooks/useExercises.ts`

### Step 6 — ExercisesSubView: wire navigation, remove ConfirmDialog

Replace `onEdit`/`onDelete` passthrough with `onNavigate` using `useNavigate`. Remove the `ConfirmDialog` render (it's gone from this page now).

**File**: `src/routes/exercises/ExerciseLibrary/views/ExercisesSubView.tsx`

### Step 7 — RoutineEditor: tappable exercise names

Add `onNavigateToExercise` optional prop to `ExerciseRow`. Wire it in `RoutineEditorView` using `libraryExercises` lookup + `useNavigate`.

**Files**: `src/routes/routines/ExerciseRow.tsx`, `src/routes/routines/RoutineEditor/views/RoutineEditorView.tsx`

## Verification checklist

```
[ ] npm run typecheck — zero errors
[ ] npm run lint — zero errors
[ ] Exercise library list shows no edit/delete buttons per row
[ ] Tapping an exercise row navigates to /exercises/:id
[ ] Exercise detail page loads exercise name, image, muscle groups
[ ] Three-dots menu opens with Edit and Delete items
[ ] Edit item opens ExerciseForm pre-filled (modal)
[ ] Saving edit updates the exercise and refreshes the detail page
[ ] Delete item shows ConfirmDialog; confirming deletes and navigates back to /exercises
[ ] Log history table shows workout history filtered to this exercise
[ ] Empty state shown when exercise has no log history
[ ] Back button navigates back to /exercises
[ ] In routine editor, tapping exercise name navigates to /exercises/:id
[ ] Back from detail (reached via routine) returns to routine editor
```

## Key paths

| Concern | File |
|---|---|
| Route definition | `src/router.tsx` |
| Exercise detail container | `src/routes/exercises/Exercise/ExerciseDetail/index.tsx` |
| Exercise detail hook | `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts` |
| Exercise detail view | `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx` |
| DB: getExerciseById | `src/db/entities/exercise/repository.ts` |
| DB: listWorkoutsByExerciseName | `src/db/entities/workout-log/repository.ts` |
| DB exports | `src/database.ts` |
| Exercise list (cleaned up) | `src/routes/exercises/Exercise/ExerciseList/index.tsx` |
| Library sub-view (wired) | `src/routes/exercises/ExerciseLibrary/views/ExercisesSubView.tsx` |
| Routine exercise row (tappable) | `src/routes/routines/ExerciseRow.tsx` |
