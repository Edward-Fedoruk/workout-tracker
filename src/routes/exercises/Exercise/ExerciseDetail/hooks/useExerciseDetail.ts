import {
  deleteExercise,
  type Exercise,
  getExerciseById,
  listMuscleGroups,
  listWorkoutsByExerciseName,
  type MuscleGroup,
  updateExercise,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues } from '@/routes/exercises/Exercise/ExerciseForm/schema';
import { groupWorkoutsByDate, type WorkoutDateGroup } from '@/utils/dateGroup';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type UseExerciseDetailReturn = ReturnType<typeof useExerciseDetail>;

export const useExerciseDetail = (exerciseId: number) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);
  const [groups, setGroups] = useState<WorkoutDateGroup[]>([]);
  const dialog = useToggle();
  const deleteConfirm = useToggle();

  const load = async () => {
    setIsLoading(true);
    const [found, allMuscleGroups] = await Promise.all([
      getExerciseById(exerciseId),
      listMuscleGroups(),
    ]);

    if (!found) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setExercise(found);
    setMuscleGroups(allMuscleGroups);

    const workouts = await listWorkoutsByExerciseName(found.name);
    setGroups(groupWorkoutsByDate(workouts));
    setIsLoading(false);
  };

  const openEdit = () => {
    setEditingExercise(exercise);
    dialog.onOpen();
  };

  const handleSave = async (values: FormValues): Promise<null | string> => {
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

  return {
    cancelDelete,
    confirmDelete,
    deleteConfirm,
    dialog,
    editingExercise,
    exercise,
    groups,
    handleSave,
    isLoading,
    load,
    muscleGroups,
    notFound,
    openEdit,
    pendingDelete,
    requestDelete,
  };
};
