import {
  deleteExercise,
  deleteWorkout,
  type Exercise,
  getBodyWeight,
  getExerciseById,
  getWorkoutById,
  listExercises,
  listMuscleGroups,
  listWorkoutsByExerciseName,
  type MuscleGroup,
  updateExercise,
  updateWorkout,
  type WorkoutTableRow,
  type WorkoutWithSets,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues as ExerciseFormValues } from '@/routes/exercises/Exercise/ExerciseForm/schema';
import { type FormValues as WorkoutFormValues } from '@/routes/workouts/WorkoutForm.schema';
import { groupWorkoutsByDate, type WorkoutDateGroup } from '@/utils/dateGroup';
import { computeEffectiveWeight, computeERM } from '@/utils/erm';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type UseExerciseDetailReturn = ReturnType<typeof useExerciseDetail>;

export const useExerciseDetail = (exerciseId: number) => {
  const navigate = useNavigate();

  // Exercise state
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);
  const [groups, setGroups] = useState<WorkoutDateGroup[]>([]);
  const [rawRows, setRawRows] = useState<WorkoutTableRow[]>([]);
  const dialog = useToggle();
  const deleteConfirm = useToggle();

  // Workout edit state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeight, setBodyWeight] = useState<null | number>(null);
  const [editingWorkout, setEditingWorkout] = useState<null | WorkoutWithSets>(
    null,
  );
  const [pendingDeleteWorkoutId, setPendingDeleteWorkoutId] = useState<
    null | number
  >(null);
  const workoutFormDialog = useToggle();
  const workoutDeleteConfirm = useToggle();

  const loadHistory = async (exerciseName: string) => {
    const rows = await listWorkoutsByExerciseName(exerciseName);
    setRawRows(rows);
    setGroups(groupWorkoutsByDate(rows));
  };

  const load = async () => {
    setIsLoading(true);
    const [found, allMuscleGroups, allExercises, bw] = await Promise.all([
      getExerciseById(exerciseId),
      listMuscleGroups(),
      listExercises(),
      getBodyWeight(),
    ]);

    if (!found) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setExercise(found);
    setMuscleGroups(allMuscleGroups);
    setExercises(allExercises);
    setBodyWeight(bw);
    await loadHistory(found.name);
    setIsLoading(false);
  };

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

    await updateExercise(
      editingExercise.id,
      values.name,
      values.muscleGroupIds,
      values.classification,
      values.imageFilename ?? null,
    );
    dialog.onClose();
    await load();
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
    await deleteExercise(target.id);
    navigate('/exercises');
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    deleteConfirm.onClose();
  };

  // Workout edit/delete
  const openEditWorkout = async (id: number) => {
    const workout = await getWorkoutById(id);
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
      await updateWorkout(
        editingWorkout.id,
        values.workoutDate,
        values.exerciseName,
        parsedSets,
      );
      workoutFormDialog.onClose();
      setEditingWorkout(null);
      if (exercise) {
        await loadHistory(exercise.name);
      }

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
    await deleteWorkout(idToDelete);
    if (exercise) {
      await loadHistory(exercise.name);
    }
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
