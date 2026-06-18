# Contract: Component prop & callback shapes

## `useRoutineStructure` (NEW hook) — `RoutineWorkout/hooks/useRoutineStructure.ts`

Owns structural mutations against the routine template. Composed by the `RoutineWorkout` container
alongside `useRoutineWorkout`.

```ts
type UseRoutineStructure = {
  structureVersion: number;          // bumped after every successful mutation
  rename: (name: string) => Promise<void>;
  addExercise: (values: { name: string; sets: number; minReps: number; maxReps: number }) => Promise<null | string>;
  editExercise: (id: number, values: { name: string; sets: number; minReps: number; maxReps: number }) => Promise<null | string>;
  deleteExercise: (id: number) => Promise<void>;
  addSet: (exerciseId: number, currentCount: number) => Promise<void>;   // no-op at 5
  removeSet: (exerciseId: number, currentCount: number) => Promise<void>; // no-op at 1
  reorder: (orderedIds: number[]) => Promise<void>;
};
```

- Each method follows **autosave-current-form → mutate DB → reload routine → bump version**.
- The container passes a `getCurrentValues: () => FormValues` (the form's `getValues`) so the hook can
  await `saveDraft` before reloading. Add/edit return a validation error string or `null`.

## `RoutineWorkoutView` (MODIFY)

Added props/callbacks (existing logging props retained):

```ts
type Added = {
  structureVersion: number;                 // triggers form reset() in an effect
  onRename: (name: string) => void;
  onAddExercise: (v: ExerciseFormValues) => Promise<null | string>;
  onEditExercise: (id: number, v: ExerciseFormValues) => Promise<null | string>;
  onDeleteExercise: (id: number) => void;   // confirm handled before calling
  onAddSet: (exerciseId: number, currentCount: number) => void;
  onRemoveSet: (exerciseId: number, currentCount: number) => void;
  onReorder: (orderedIds: number[]) => void;
};
```

- Wraps cards in `DndContext` + `SortableContext`; `onDragEnd` → `arrayMove` → `onReorder`.
- Header: routine name + pencil → `RoutineNameForm` (rename). Add-exercise → `RoutineExerciseForm` (create).
- Runs `reset(buildFormValues(...))` in a `useEffect` keyed on `structureVersion`.

## `RoutineExerciseCard` (NEW) — `RoutineWorkout/views/RoutineExerciseCard/index.tsx`

```ts
type RoutineExerciseCardProps = {
  exercise: RoutineExercise;
  exerciseIndex: number;
  classification: ExerciseClassification;
  imageFilename?: string;
  prefill: LastExerciseSets;
  allCompleted: boolean;                 // → green card
  register: UseFormRegister<FormValues>;
  watch: UseFormWatch<FormValues>;
  errors: FieldErrors<FormValues>;
  dragHandleProps: SortableDragHandleProps; // from useSortable (listeners + attributes)
  onAutoSave: () => void;
  onEdit: () => void;                    // three-dots → edit rep range (RoutineExerciseForm)
  onDelete: () => void;                  // three-dots → delete (confirm)
  onAddSet: () => void;                  // outlined button, disabled at 5
  onRemoveSet: () => void;               // outlined button, disabled at 1
  onNavigateToExercise?: () => void;
};
```

- MUI `Card`; `bgcolor` green when `allCompleted`.
- Renders `RoutineWorkoutSetRow` per set (alternating gray via `setIndex % 2`; completed row keeps green tint).
- Outlined "+ Set" / "− Set" buttons beneath the set rows.
- Three-dots `IconButton` → `Menu` with Edit + Delete; drag handle icon wired to `dragHandleProps`.

## `RoutineWorkoutSetRow` (NEW) — extracted from current `RoutineWorkoutExercise`

Same weight/reps/completed fields as today; adds `striped: boolean` for alternating gray background.

## Routine list (MODIFY)

- `RoutineListView`: `onAdd` (create + open), `onOpen(id)` (single tap → merged view), `onDelete(id)`.
- `RoutineCard`: tap row → `onOpen`; three-dots menu → Delete (confirm). Remove the separate Start button;
  keep the "In Progress" chip from `draftRoutineId`.

## Exercise library add button (MODIFY)

- `ExerciseLibraryView` renders one secondary `Fab` (`AddIcon`, `bottom:80/right:24`), prop `onAdd`.
- Container `ExerciseLibrary/index.tsx`: `onAdd = subView === 'exercises' ? exercises.openCreate : muscleGroups.openCreate`.
- `ExercisesSubView` / `MuscleGroupsSubView`: remove the top contained "Add …" button; keep their dialogs.
