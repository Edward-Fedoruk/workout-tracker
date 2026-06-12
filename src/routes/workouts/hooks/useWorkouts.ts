import {
  createWorkout,
  deleteWorkout,
  type Exercise,
  getBodyWeight,
  getWorkoutById,
  listExercises,
  listWorkouts,
  updateWorkout,
  type WorkoutTableRow,
  type WorkoutWithSets,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues } from '@/routes/workouts/WorkoutForm.schema';
import { groupWorkoutsByDate } from '@/utils/dateGroup';
import { computeEffectiveWeight, computeERM } from '@/utils/erm';
import { useMemo, useState } from 'react';

export type UseWorkoutsReturn = ReturnType<typeof useWorkouts>;

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState<WorkoutTableRow[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeight, setBodyWeight] = useState<null | number>(null);
  const [editingWorkout, setEditingWorkout] = useState<null | WorkoutWithSets>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<null | number>(null);

  const formDialog = useToggle();
  const deleteConfirm = useToggle();
  const advancedView = useToggle();

  const refresh = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [rows, exerciseList, bw] = await Promise.all([
        listWorkouts(),
        listExercises(),
        getBodyWeight(),
      ]);
      setWorkouts(rows);
      setExercises(exerciseList);
      setBodyWeight(bw);
    } catch {
      setLoadError('Failed to load workouts. Please reload the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingWorkout(null);
    formDialog.onOpen();
  };

  const openEdit = async (id: number) => {
    const workout = await getWorkoutById(id);
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
        await updateWorkout(
          editingWorkout.id,
          values.workoutDate,
          values.exerciseName,
          parsedSets,
        );
      } else {
        await createWorkout(
          values.workoutDate,
          values.exerciseName,
          parsedSets,
        );
      }

      await refresh();
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
      await deleteWorkout(idToDelete);
      await refresh();
    } catch {
      setLoadError('Failed to delete workout. Please try again.');
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
