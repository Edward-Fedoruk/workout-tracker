# UI Contract: Exercise Detail Page

## Route

`/exercises/:id` — `id` is the integer primary key of the `exercise` row.

---

## ExerciseDetail container

**File**: `src/routes/exercises/Exercise/ExerciseDetail/index.tsx`  
**Export**: `ExerciseDetail`

Reads `:id` param via `useParams`. Delegates to `useExerciseDetail(id)`. Renders `ExerciseDetailView` when ready, or a loading spinner / "Not found" state.

---

## useExerciseDetail hook

**File**: `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts`

```ts
type UseExerciseDetailReturn = {
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  deleteConfirm: { isOpen: boolean; onClose: () => void; onOpen: () => void };
  dialog: { isOpen: boolean; onClose: () => void; onOpen: () => void };
  editingExercise: Exercise | null;
  exercise: Exercise | null;
  groups: WorkoutDateGroup[];
  handleSave: (values: FormValues) => Promise<null | string>;
  isLoading: boolean;
  muscleGroups: MuscleGroup[];
  notFound: boolean;
  openEdit: () => void;
  requestDelete: () => void;
};
```

Fetches exercise via `getExerciseById(id)` and history via `listWorkoutsByExerciseName(exercise.name)`. Calls `useNavigate()` to go back to `/exercises` after confirmed deletion.

---

## ExerciseDetailView

**File**: `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx`

Props mirror `UseExerciseDetailReturn` plus an `onBack: () => void` callback.

Layout (mobile-first):

```
┌──────────────────────────────────┐
│ ← [back]   Exercise Name     [⋮] │  ← header row: back button, name, three-dots menu
├──────────────────────────────────┤
│ [avatar image]                   │
│ Muscle group chips               │
│ Classification badge             │
├──────────────────────────────────┤
│ History                          │  ← section heading
│ ┌──────────────────────────────┐ │
│ │  GroupedWorkoutTable         │ │  ← read-only (no onDelete/onEdit)
│ └──────────────────────────────┘ │
│  "No history yet." (empty state) │
└──────────────────────────────────┘
```

- Three-dots `IconButton` (`MoreVertIcon`) opens an MUI `Menu` anchored to the button.
- Menu items: "Edit" → `openEdit()`, "Delete" → `requestDelete()`.
- `ExerciseForm` dialog rendered here in `'edit'` mode only (create handled in library list).
- `ConfirmDialog` rendered here for delete.

---

## ExerciseList changes

**File**: `src/routes/exercises/Exercise/ExerciseList/index.tsx`

| Before | After |
|---|---|
| Props: `exercises`, `onEdit`, `onDelete` | Props: `exercises`, `onNavigate: (exercise: Exercise) => void` |
| `secondaryAction` with Edit/Delete buttons | Removed |
| `ListItem` is static | `ListItem` gets `onClick={() => onNavigate(exercise)}` + `sx={{ cursor: 'pointer' }}` |

---

## ExercisesSubView changes

**File**: `src/routes/exercises/ExerciseLibrary/views/ExercisesSubView.tsx`

- Remove `onDelete={requestDelete}` and `onEdit={openEdit}` from `<ExerciseList>`.
- Add `onNavigate={(ex) => navigate('/exercises/' + ex.id)}` (uses `useNavigate`).
- Remove `<ConfirmDialog>` (moves to ExerciseDetail).
- `<ExerciseForm>` remains for create-only (`mode="create"`).

---

## useExercises hook changes

**File**: `src/routes/exercises/ExerciseLibrary/hooks/useExercises.ts`

Remove: `openEdit`, `requestDelete`, `pendingDelete`, `deleteConfirm`, `confirmDelete`, `cancelDelete`, `editingExercise`.  
Keep: `exercises`, `refresh`, `openCreate`, `handleSave` (create path only), `dialog`, `dialogMode` (always `'create'`).

---

## GroupedWorkoutTable changes

**File**: `src/routes/workouts/GroupedWorkoutTable/index.tsx`

Make `onDelete` and `onEdit` optional:

```ts
type Props = {
  readonly groups: WorkoutDateGroup[];
  readonly onDelete?: (id: number) => void;
  readonly onEdit?: (id: number) => void;
};
```

When both are absent, omit the action `<TableCell>` column entirely (including the header cell) so the table renders without an empty trailing column.

---

## ExerciseRow changes

**File**: `src/routes/routines/ExerciseRow.tsx`

Add optional prop:

```ts
onNavigateToExercise?: () => void;
```

When provided, wrap the exercise name `Typography` in a `ButtonBase` (or `Box component="button"`) with an `onClick` handler. Style it to look like text (no button chrome).

---

## RoutineEditorView changes

**File**: `src/routes/routines/RoutineEditor/views/RoutineEditorView.tsx`

When rendering each `ExerciseRow`, look up `exercise.id` from `libraryExercises` by `exerciseName`, then pass:

```tsx
onNavigateToExercise={
  (() => {
    const found = libraryExercises.find(e => e.name === exercise.exerciseName);
    return found ? () => navigate('/exercises/' + found.id) : undefined;
  })()
}
```

---

## Router changes

**File**: `src/router.tsx`

```ts
{ element: <ExerciseDetail />, path: '/exercises/:id' }
```

Added after the existing `/exercises` route.
