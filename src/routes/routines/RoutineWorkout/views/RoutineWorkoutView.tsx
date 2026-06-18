import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  type Exercise,
  type LastExerciseSets,
  type RoutineExercise,
  type RoutineWithExercises,
  type StoredDraftData,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { RoutineExerciseForm } from '@/routes/routines/RoutineExerciseForm';
import { type FormValues as ExerciseFormValues } from '@/routes/routines/RoutineExerciseForm.schema';
import { RoutineNameForm } from '@/routes/routines/RoutineNameForm';
import { buildFormValues } from '@/routes/routines/RoutineWorkout/buildFormValues';
import {
  type FormValues,
  resolver,
} from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import { RoutineExerciseCard } from '@/routes/routines/RoutineWorkout/views/RoutineExerciseCard';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

export type RoutineWorkoutViewProps = {
  readonly bodyWeight: null | number;
  readonly draftData: null | StoredDraftData;
  readonly error: null | string;
  readonly exerciseImageMap: Map<string, string | undefined>;
  readonly exercises: Exercise[];
  readonly isSubmitting: boolean;
  readonly onAddExercise: (
    values: ExerciseFormValues,
  ) => Promise<null | string>;
  readonly onAddSet: (exerciseId: number, currentCount: number) => void;
  readonly onAutoSave: (values: FormValues) => void;
  readonly onBack: () => void;
  readonly onDeleteExercise: (id: number) => void;
  readonly onDiscard: () => void;
  readonly onEditExercise: (
    id: number,
    values: ExerciseFormValues,
  ) => Promise<null | string>;
  readonly onRegisterGetValues: (getValues: () => FormValues) => void;
  readonly onRemoveSet: (exerciseId: number, currentCount: number) => void;
  readonly onRename: (name: string) => void;
  readonly onReorder: (orderedIds: number[]) => void;
  readonly onSubmit: (values: FormValues) => Promise<void>;
  readonly prefills: Map<number, LastExerciseSets>;
  readonly routine: RoutineWithExercises;
  readonly structureVersion: number;
};

export const RoutineWorkoutView = ({
  bodyWeight,
  draftData,
  error,
  exerciseImageMap,
  exercises,
  isSubmitting,
  onAddExercise,
  onAddSet,
  onAutoSave,
  onBack,
  onDeleteExercise,
  onDiscard,
  onEditExercise,
  onRegisterGetValues,
  onRemoveSet,
  onRename,
  onReorder,
  onSubmit,
  prefills,
  routine,
  structureVersion,
}: RoutineWorkoutViewProps) => {
  const navigate = useNavigate();
  const discardConfirm = useToggle();
  const renameDialog = useToggle();
  const exerciseDialog = useToggle();
  const deleteConfirm = useToggle();
  const [editingExercise, setEditingExercise] =
    useState<null | RoutineExercise>(null);
  const [pendingDelete, setPendingDelete] = useState<null | RoutineExercise>(
    null,
  );

  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormValues>({
    defaultValues: buildFormValues(
      routine,
      draftData,
      prefills,
      exercises,
      bodyWeight,
    ),
    mode: 'onBlur',
    resolver,
  });

  // Expose getValues so the container can autosave before structural mutations.
  useEffect(() => {
    onRegisterGetValues(getValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getValues is stable; register once
  }, []);

  // Re-project the form whenever a structural edit completes.
  useEffect(() => {
    reset(buildFormValues(routine, draftData, prefills, exercises, bodyWeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seed only on structural changes
  }, [structureVersion]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const exercisesValues = watch('exercises');
  const allSetsCompleted =
    exercisesValues.length > 0 &&
    exercisesValues.every((ex) =>
      ex.sets.every((set) => set.completed === true),
    );

  const handleAutoSave = () => {
    onAutoSave(getValues());
  };

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const ids = routine.exercises.map((exercise) => exercise.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  const openAddExercise = () => {
    setEditingExercise(null);
    exerciseDialog.onOpen();
  };

  const handleExerciseSave = async (
    values: ExerciseFormValues,
  ): Promise<null | string> => {
    const result = editingExercise
      ? await onEditExercise(editingExercise.id, values)
      : await onAddExercise(values);
    if (result === null) {
      exerciseDialog.onClose();
    }

    return result;
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2 }}>
        <IconButton
          aria-label="Go back"
          onClick={onBack}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          sx={{ flex: 1 }}
          variant="h5"
        >
          {routine.name}
        </Typography>
        <IconButton
          aria-label="Rename routine"
          onClick={() => renameDialog.onOpen()}
        >
          <EditIcon />
        </IconButton>
      </Box>

      {error !== null && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={routine.exercises.map((exercise) => exercise.id)}
          strategy={verticalListSortingStrategy}
        >
          {routine.exercises.map((routineExercise, exerciseIndex) => {
            const classification =
              exercises.find(
                (option) => option.name === routineExercise.exerciseName,
              )?.classification ?? 'standard';
            const found = exercises.find(
              (library) => library.name === routineExercise.exerciseName,
            );
            return (
              <RoutineExerciseCard
                classification={classification}
                errors={errors}
                exercise={routineExercise}
                exerciseIndex={exerciseIndex}
                imageFilename={exerciseImageMap.get(
                  routineExercise.exerciseName,
                )}
                key={routineExercise.id}
                onAddSet={() =>
                  onAddSet(routineExercise.id, routineExercise.suggestedSets)
                }
                onAutoSave={handleAutoSave}
                onDelete={() => {
                  setPendingDelete(routineExercise);
                  deleteConfirm.onOpen();
                }}
                onEdit={() => {
                  setEditingExercise(routineExercise);
                  exerciseDialog.onOpen();
                }}
                onRemoveSet={() =>
                  onRemoveSet(routineExercise.id, routineExercise.suggestedSets)
                }
                prefill={prefills.get(routineExercise.id) ?? []}
                register={register}
                watch={watch}
                {...(found !== undefined && {
                  onNavigateToExercise: () =>
                    navigate(`/exercises/${found.id}`),
                })}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      <Button
        fullWidth
        onClick={openAddExercise}
        sx={{ mt: 1 }}
        variant="outlined"
      >
        Add Exercise
      </Button>

      <Button
        disabled={isSubmitting || !allSetsCompleted}
        fullWidth
        onClick={() => {
          submit().catch(() => undefined);
        }}
        size="large"
        sx={{ mt: 2 }}
        variant="contained"
      >
        {isSubmitting ? 'Saving…' : 'Log Workout'}
      </Button>

      <Button
        color="error"
        disabled={isSubmitting}
        fullWidth
        onClick={() => discardConfirm.onOpen()}
        size="large"
        sx={{ mt: 1 }}
        variant="outlined"
      >
        Discard
      </Button>

      <RoutineExerciseForm
        initialValues={
          editingExercise
            ? {
                maxReps: editingExercise.maxReps,
                minReps: editingExercise.minReps,
                name: editingExercise.exerciseName,
                sets: editingExercise.suggestedSets,
              }
            : undefined
        }
        isSubmitting={isSubmitting}
        libraryExercises={exercises}
        mode={editingExercise ? 'edit' : 'create'}
        onCancel={() => exerciseDialog.onClose()}
        onSave={handleExerciseSave}
        open={exerciseDialog.isOpen}
      />

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => renameDialog.onClose()}
        open={renameDialog.isOpen}
      >
        <DialogTitle>Rename routine</DialogTitle>
        <DialogContent>
          <RoutineNameForm
            isSaving={false}
            onSave={async (values) => {
              onRename(values.name);
              renameDialog.onClose();
            }}
            value={routine.name}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmColor="error"
        confirmLabel="Delete"
        onCancel={() => {
          setPendingDelete(null);
          deleteConfirm.onClose();
        }}
        onConfirm={() => {
          if (pendingDelete) {
            onDeleteExercise(pendingDelete.id);
          }

          setPendingDelete(null);
          deleteConfirm.onClose();
        }}
        open={deleteConfirm.isOpen}
        title="Delete Exercise"
      >
        Delete &ldquo;{pendingDelete?.exerciseName}&rdquo; from this routine?
      </ConfirmDialog>

      <ConfirmDialog
        confirmColor="error"
        confirmLabel="Discard"
        onCancel={() => discardConfirm.onClose()}
        onConfirm={() => {
          discardConfirm.onClose();
          onDiscard();
        }}
        open={discardConfirm.isOpen}
        title="Discard Workout"
      >
        Discard this in-progress workout? Your entered values will be lost.
      </ConfirmDialog>
    </Box>
  );
};
