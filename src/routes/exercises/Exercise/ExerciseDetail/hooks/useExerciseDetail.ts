import { type Exercise, type WorkoutWithSets } from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues as ExerciseFormValues } from '@/routes/exercises/Exercise/ExerciseForm/schema';
import { type FormValues as WorkoutFormValues } from '@/routes/workouts/WorkoutForm.schema';
import {
  useDeleteExerciseMutation,
  useGetExerciseQuery,
  useListExercisesQuery,
  useUpdateExerciseMutation,
} from '@/store/entities/exercises';
import { useListMuscleGroupsQuery } from '@/store/entities/muscleGroups';
import { useGetBodyWeightQuery } from '@/store/entities/settings';
import {
  useDeleteWorkoutMutation,
  useLazyGetWorkoutQuery,
  useListWorkoutsByExerciseNameQuery,
  useUpdateWorkoutMutation,
} from '@/store/entities/workouts';
import { groupWorkoutsByDate } from '@/utils/dateGroup';
import { computeEffectiveWeight, computeERM } from '@/utils/erm';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type UseExerciseDetailReturn = ReturnType<typeof useExerciseDetail>;

export const useExerciseDetail = (exerciseId: number) => {
  const navigate = useNavigate();

  const exerciseQuery = useGetExerciseQuery(exerciseId);
  const muscleGroupsQuery = useListMuscleGroupsQuery();
  const exercisesQuery = useListExercisesQuery();
  const bodyWeightQuery = useGetBodyWeightQuery();

  const exercise = exerciseQuery.data ?? null;

  const historyQuery = useListWorkoutsByExerciseNameQuery(
    exercise ? exercise.name : skipToken,
  );

  const [updateExercise] = useUpdateExerciseMutation();
  const [deleteExercise] = useDeleteExerciseMutation();
  const [updateWorkout] = useUpdateWorkoutMutation();
  const [deleteWorkout] = useDeleteWorkoutMutation();
  const [fetchWorkout] = useLazyGetWorkoutQuery();

  const muscleGroups = muscleGroupsQuery.data ?? [];
  const exercises = exercisesQuery.data ?? [];
  const bodyWeight = bodyWeightQuery.data ?? null;
  const rawRows = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);

  const isLoading =
    exerciseQuery.isLoading ||
    muscleGroupsQuery.isLoading ||
    exercisesQuery.isLoading ||
    bodyWeightQuery.isLoading ||
    historyQuery.isLoading;
  const notFound = exerciseQuery.isSuccess && exercise === null;

  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);
  const dialog = useToggle();
  const deleteConfirm = useToggle();

  // Workout edit state
  const [editingWorkout, setEditingWorkout] = useState<null | WorkoutWithSets>(
    null,
  );
  const [pendingDeleteWorkoutId, setPendingDeleteWorkoutId] = useState<
    null | number
  >(null);
  const workoutFormDialog = useToggle();
  const workoutDeleteConfirm = useToggle();

  const groups = useMemo(() => groupWorkoutsByDate(rawRows), [rawRows]);

  // Cache invalidation keeps data fresh; kept as a resolved no-op so the view's
  // mount-time call stays valid (HR-2).
  const load = async (): Promise<void> => undefined;

  // Exercise edit/delete
  const openEdit = () => {
    setEditingExercise(exercise);
    dialog.onOpen();
  };

  const handleSave = async (
    values: ExerciseFormValues,
  ): Promise<null | string> => {
    if (!editingExercise) {
      return null;
    }

    await updateExercise({
      classification: values.classification,
      id: editingExercise.id,
      imageFilename: values.imageFilename ?? null,
      muscleGroupIds: values.muscleGroupIds,
      name: values.name,
    }).unwrap();
    dialog.onClose();
    return null;
  };

  const requestDelete = () => {
    setPendingDelete(exercise);
    deleteConfirm.onOpen();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    const target = pendingDelete;
    setPendingDelete(null);
    deleteConfirm.onClose();
    await deleteExercise(target.id).unwrap();
    navigate('/exercises');
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    deleteConfirm.onClose();
  };

  // Workout edit/delete
  const openEditWorkout = async (id: number) => {
    const workout = await fetchWorkout(id).unwrap();
    setEditingWorkout(workout);
    workoutFormDialog.onOpen();
  };

  const handleCancelWorkoutForm = () => {
    workoutFormDialog.onClose();
    setEditingWorkout(null);
  };

  const handleSaveWorkout = async (
    values: WorkoutFormValues,
  ): Promise<null | string> => {
    if (!editingWorkout) {
      return null;
    }

    const parsedSets = values.sets.map((set) => {
      const weight =
        Number.isNaN(set.weight) || set.weight === '' ? null : set.weight;
      const effective = computeEffectiveWeight({
        bodyWeight: values.bodyWeight,
        classification: values.classification,
        loggedWeight: weight,
      });
      const erm = effective === null ? null : computeERM(effective, set.reps);
      return { erm, reps: set.reps, weight };
    });

    try {
      await updateWorkout({
        exerciseName: values.exerciseName,
        id: editingWorkout.id,
        sets: parsedSets,
        workoutDate: values.workoutDate,
      }).unwrap();
      workoutFormDialog.onClose();
      setEditingWorkout(null);
      return null;
    } catch {
      return 'Failed to save workout. Please try again.';
    }
  };

  const requestDeleteWorkout = (id: number) => {
    setPendingDeleteWorkoutId(id);
    workoutDeleteConfirm.onOpen();
  };

  const confirmDeleteWorkout = async () => {
    if (pendingDeleteWorkoutId === null) {
      return;
    }

    const idToDelete = pendingDeleteWorkoutId;
    setPendingDeleteWorkoutId(null);
    workoutDeleteConfirm.onClose();
    await deleteWorkout(idToDelete).unwrap();
  };

  const cancelDeleteWorkout = () => {
    setPendingDeleteWorkoutId(null);
    workoutDeleteConfirm.onClose();
  };

  return {
    bodyWeight,
    cancelDelete,
    cancelDeleteWorkout,
    confirmDelete,
    confirmDeleteWorkout,
    deleteConfirm,
    dialog,
    editingExercise,
    editingWorkout,
    exercise,
    exercises,
    groups,
    handleCancelWorkoutForm,
    handleSave,
    handleSaveWorkout,
    isLoading,
    load,
    muscleGroups,
    notFound,
    openEdit,
    openEditWorkout,
    pendingDelete,
    rawRows,
    requestDelete,
    requestDeleteWorkout,
    workoutDeleteConfirm,
    workoutFormDialog,
  };
};
