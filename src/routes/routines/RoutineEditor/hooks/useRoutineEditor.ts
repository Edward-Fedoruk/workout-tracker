import {
  addRoutineExercise,
  createRoutine,
  deleteRoutine,
  deleteRoutineExercise,
  type Exercise,
  getRoutineById,
  listExercises,
  moveRoutineExercise,
  type RoutineExercise,
  type RoutineWithExercises,
  updateRoutine,
  updateRoutineExercise,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues as ExerciseFormValues } from '@/routes/routines/RoutineExerciseForm.schema';
import { type FormValues as NameFormValues } from '@/routes/routines/RoutineNameForm.schema';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type UseRoutineEditorReturn = ReturnType<typeof useRoutineEditor>;

export const useRoutineEditor = () => {
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<null | RoutineWithExercises>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoutineId, setCurrentRoutineId] = useState<null | number>(null);
  const [routineName, setRoutineName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [libraryExercises, setLibraryExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] =
    useState<null | RoutineExercise>(null);
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false);

  const exerciseDialog = useToggle();
  const deleteConfirm = useToggle();
  const editNameDialog = useToggle();

  const loadRoutine = async (rid: number): Promise<boolean> => {
    const data = await getRoutineById(rid);
    if (!data) {
      return false;
    }

    setRoutine(data);
    setRoutineName(data.name);
    return true;
  };

  const init = async (routineId: null | number): Promise<boolean> => {
    const exercises = await listExercises();
    setLibraryExercises(exercises);

    if (routineId === null) {
      setRoutineName('');
      setIsLoading(false);
      return true;
    }

    setCurrentRoutineId(routineId);
    const found = await loadRoutine(routineId);
    setIsLoading(false);
    return found;
  };

  const handleSaveName = async (values: NameFormValues): Promise<void> => {
    setIsSavingName(true);
    if (currentRoutineId === null) {
      const newId = await createRoutine(values.name);
      setCurrentRoutineId(newId);
      await loadRoutine(newId);
    } else {
      await updateRoutine(currentRoutineId, values.name);
      await loadRoutine(currentRoutineId);
    }

    setIsSavingName(false);
  };

  const openAddExercise = () => {
    setEditingExercise(null);
    exerciseDialog.onOpen();
  };

  const openEditExercise = (exercise: RoutineExercise) => {
    setEditingExercise(exercise);
    exerciseDialog.onOpen();
  };

  const handleExerciseSave = async (
    values: ExerciseFormValues,
  ): Promise<null | string> => {
    if (currentRoutineId === null) {
      return 'Save the routine name first';
    }

    setIsSubmittingExercise(true);
    if (editingExercise) {
      await updateRoutineExercise(
        editingExercise.id,
        values.name,
        values.sets,
        values.minReps,
        values.maxReps,
      );
    } else {
      await addRoutineExercise(
        currentRoutineId,
        values.name,
        values.sets,
        values.minReps,
        values.maxReps,
      );
    }

    setIsSubmittingExercise(false);
    exerciseDialog.onClose();
    await loadRoutine(currentRoutineId);
    return null;
  };

  const handleDeleteExercise = async (exercise: RoutineExercise) => {
    if (currentRoutineId === null) {
      return;
    }

    await deleteRoutineExercise(exercise.id, currentRoutineId);
    await loadRoutine(currentRoutineId);
  };

  const handleMove = async (
    exercise: RoutineExercise,
    direction: 'down' | 'up',
  ) => {
    if (currentRoutineId === null) {
      return;
    }

    await moveRoutineExercise(exercise.id, currentRoutineId, direction);
    await loadRoutine(currentRoutineId);
  };

  const requestDelete = () => {
    deleteConfirm.onOpen();
  };

  const cancelDelete = () => {
    deleteConfirm.onClose();
  };

  const handleConfirmDelete = async () => {
    if (currentRoutineId === null) {
      return;
    }

    deleteConfirm.onClose();
    await deleteRoutine(currentRoutineId);
    navigate('/routines');
  };

  const openEditName = () => {
    editNameDialog.onOpen();
  };

  const closeEditName = () => {
    editNameDialog.onClose();
  };

  return {
    cancelDelete,
    closeEditName,
    currentRoutineId,
    deleteConfirm,
    editingExercise,
    editNameDialog,
    exerciseDialog,
    handleConfirmDelete,
    handleDeleteExercise,
    handleExerciseSave,
    handleMove,
    handleSaveName,
    init,
    isLoading,
    isSavingName,
    isSubmittingExercise,
    libraryExercises,
    openAddExercise,
    openEditExercise,
    openEditName,
    requestDelete,
    routine,
    routineName,
  };
};
