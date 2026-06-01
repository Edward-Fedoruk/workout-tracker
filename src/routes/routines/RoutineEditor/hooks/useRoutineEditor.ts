import {
  addRoutineExercise,
  createRoutine,
  deleteRoutineExercise,
  type Exercise,
  getRoutineById,
  listExercises,
  moveRoutineExercise,
  type RoutineExercise,
  type RoutineWithExercises,
  updateRoutine,
  updateRoutineExercise,
} from '../../../../database';
import { useToggle } from '../../../../hooks/useToggle';
import { validateExercise, validateRoutineName } from '../../routineUtilities';
import { useState } from 'react';

type ExerciseErrors = {
  maxReps?: string;
  minReps?: string;
  name?: string;
  sets?: string;
};

type ExerciseFormState = {
  maxReps: string;
  minReps: string;
  name: string;
  sets: string;
};

const DEFAULT_FORM: ExerciseFormState = {
  maxReps: '12',
  minReps: '8',
  name: '',
  sets: '3',
};

export type UseRoutineEditorReturn = ReturnType<typeof useRoutineEditor>;

export const useRoutineEditor = () => {
  const [routine, setRoutine] = useState<null | RoutineWithExercises>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoutineId, setCurrentRoutineId] = useState<null | number>(null);
  const [routineName, setRoutineName] = useState('');
  const [routineNameError, setRoutineNameError] = useState<null | string>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [libraryExercises, setLibraryExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] =
    useState<null | RoutineExercise>(null);
  const [exerciseForm, setExerciseForm] =
    useState<ExerciseFormState>(DEFAULT_FORM);
  const [exerciseErrors, setExerciseErrors] = useState<ExerciseErrors>({});
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false);

  const exerciseDialog = useToggle();

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

  const handleSaveName = async () => {
    const nameError = validateRoutineName(routineName);
    if (nameError) {
      setRoutineNameError(nameError);
      return;
    }

    setIsSavingName(true);
    if (currentRoutineId === null) {
      const newId = await createRoutine(routineName.trim());
      setCurrentRoutineId(newId);
      await loadRoutine(newId);
    } else {
      await updateRoutine(currentRoutineId, routineName.trim());
      await loadRoutine(currentRoutineId);
    }

    setIsSavingName(false);
  };

  const openAddExercise = () => {
    setEditingExercise(null);
    setExerciseForm(DEFAULT_FORM);
    setExerciseErrors({});
    exerciseDialog.onOpen();
  };

  const openEditExercise = (exercise: RoutineExercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      maxReps: String(exercise.maxReps),
      minReps: String(exercise.minReps),
      name: exercise.exerciseName,
      sets: String(exercise.suggestedSets),
    });
    setExerciseErrors({});
    exerciseDialog.onOpen();
  };

  const handleExerciseSubmit = async () => {
    const setsNumber = Number.parseInt(exerciseForm.sets, 10);
    const minRepsNumber = Number.parseInt(exerciseForm.minReps, 10);
    const maxRepsNumber = Number.parseInt(exerciseForm.maxReps, 10);
    const errors = validateExercise(
      exerciseForm.name,
      setsNumber,
      minRepsNumber,
      maxRepsNumber,
    );

    if (Object.keys(errors).length > 0) {
      setExerciseErrors(errors);
      return;
    }

    if (currentRoutineId === null) {
      setExerciseErrors({ name: 'Save the routine name first' });
      return;
    }

    setIsSubmittingExercise(true);
    if (editingExercise) {
      await updateRoutineExercise(
        editingExercise.id,
        exerciseForm.name.trim(),
        setsNumber,
        minRepsNumber,
        maxRepsNumber,
      );
    } else {
      await addRoutineExercise(
        currentRoutineId,
        exerciseForm.name.trim(),
        setsNumber,
        minRepsNumber,
        maxRepsNumber,
      );
    }

    setIsSubmittingExercise(false);
    exerciseDialog.onClose();
    await loadRoutine(currentRoutineId);
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

  return {
    currentRoutineId,
    editingExercise,
    exerciseDialog,
    exerciseErrors,
    exerciseForm,
    handleDeleteExercise,
    handleExerciseSubmit,
    handleMove,
    handleSaveName,
    init,
    isLoading,
    isSavingName,
    isSubmittingExercise,
    libraryExercises,
    openAddExercise,
    openEditExercise,
    routine,
    routineName,
    routineNameError,
    setExerciseErrors,
    setExerciseForm,
    setRoutineName,
    setRoutineNameError,
  };
};
