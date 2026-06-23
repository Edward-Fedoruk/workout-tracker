import { type WorkoutWithSets } from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues } from '@/routes/workouts/WorkoutForm.schema';
import { useListExercisesQuery } from '@/store/entities/exercises';
import {
  useGetBodyWeightQuery,
  useGetExerciseNamesInTablesQuery,
} from '@/store/entities/settings';
import {
  useCreateWorkoutMutation,
  useDeleteWorkoutMutation,
  useLazyGetWorkoutQuery,
  useListWorkoutsQuery,
  useUpdateWorkoutMutation,
} from '@/store/entities/workouts';
import { groupWorkoutsByDate } from '@/utils/dateGroup';
import { computeEffectiveWeight, computeERM } from '@/utils/erm';
import { useMemo, useState } from 'react';

export type UseWorkoutsReturn = ReturnType<typeof useWorkouts>;

export const useWorkouts = () => {
  const workoutsQuery = useListWorkoutsQuery();
  const exercisesQuery = useListExercisesQuery();
  const bodyWeightQuery = useGetBodyWeightQuery();
  const displayNamesQuery = useGetExerciseNamesInTablesQuery();

  const [createWorkout] = useCreateWorkoutMutation();
  const [updateWorkout] = useUpdateWorkoutMutation();
  const [deleteWorkout] = useDeleteWorkoutMutation();
  const [fetchWorkout] = useLazyGetWorkoutQuery();

  const workouts = useMemo(
    () => workoutsQuery.data ?? [],
    [workoutsQuery.data],
  );
  const exercises = exercisesQuery.data ?? [];
  const bodyWeight = bodyWeightQuery.data ?? null;
  const exerciseNamesInTables = displayNamesQuery.data ?? false;

  const [editingWorkout, setEditingWorkout] = useState<null | WorkoutWithSets>(
    null,
  );
  const [actionError, setActionError] = useState<null | string>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<null | number>(null);

  const formDialog = useToggle();
  const deleteConfirm = useToggle();
  const advancedView = useToggle();

  const isLoading =
    workoutsQuery.isLoading ||
    exercisesQuery.isLoading ||
    bodyWeightQuery.isLoading ||
    displayNamesQuery.isLoading;

  const loadError =
    workoutsQuery.isError ||
    exercisesQuery.isError ||
    bodyWeightQuery.isError ||
    displayNamesQuery.isError
      ? 'Failed to load workouts. Please reload the page.'
      : actionError;

  // Cache invalidation keeps lists fresh; kept as a resolved no-op so the
  // view's mount-time call stays valid (HR-2).
  const refresh = async (): Promise<void> => undefined;

  const openCreate = () => {
    setEditingWorkout(null);
    formDialog.onOpen();
  };

  const openEdit = async (id: number) => {
    const workout = await fetchWorkout(id).unwrap();
    setEditingWorkout(workout);
    formDialog.onOpen();
  };

  const handleCancelForm = () => {
    formDialog.onClose();
    setEditingWorkout(null);
  };

  const handleSave = async (values: FormValues): Promise<null | string> => {
    const parsedSets = values.sets.map((set) => {
      const weight = Number.isNaN(set.weight) ? null : set.weight;
      const effective = computeEffectiveWeight({
        bodyWeight: values.bodyWeight,
        classification: values.classification,
        loggedWeight: weight,
      });
      const erm = effective === null ? null : computeERM(effective, set.reps);
      return { erm, reps: set.reps, weight };
    });

    try {
      if (editingWorkout) {
        await updateWorkout({
          exerciseName: values.exerciseName,
          id: editingWorkout.id,
          sets: parsedSets,
          workoutDate: values.workoutDate,
        }).unwrap();
      } else {
        await createWorkout({
          exerciseName: values.exerciseName,
          sets: parsedSets,
          workoutDate: values.workoutDate,
        }).unwrap();
      }

      formDialog.onClose();
      setEditingWorkout(null);
      return null;
    } catch {
      return 'Failed to save workout. Please try again.';
    }
  };

  const requestDelete = (id: number) => {
    setPendingDeleteId(id);
    deleteConfirm.onOpen();
  };

  const confirmDelete = async () => {
    if (pendingDeleteId === null) {
      return;
    }

    const idToDelete = pendingDeleteId;
    setPendingDeleteId(null);
    deleteConfirm.onClose();
    try {
      await deleteWorkout(idToDelete).unwrap();
    } catch {
      setActionError('Failed to delete workout. Please try again.');
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    deleteConfirm.onClose();
  };

  const groups = useMemo(() => groupWorkoutsByDate(workouts), [workouts]);

  return {
    advancedView,
    bodyWeight,
    cancelDelete,
    confirmDelete,
    deleteConfirm,
    editingWorkout,
    exerciseNamesInTables,
    exercises,
    formDialog,
    groups,
    handleCancelForm,
    handleSave,
    isLoading,
    loadError,
    openCreate,
    openEdit,
    refresh,
    requestDelete,
    workouts,
  };
};
