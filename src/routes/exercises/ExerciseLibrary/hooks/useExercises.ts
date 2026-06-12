import { createExercise, type Exercise, listExercises } from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues } from '@/routes/exercises/Exercise/ExerciseForm/schema';
import { useState } from 'react';

export type UseExercisesReturn = ReturnType<typeof useExercises>;

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const dialog = useToggle();

  const refresh = async () => {
    const list = await listExercises();
    setExercises(list);
  };

  const openCreate = () => {
    dialog.onOpen();
  };

  const handleSave = async (values: FormValues): Promise<null | string> => {
    const lowerName = values.name.toLowerCase();
    const isDuplicate = exercises.some(
      (item) => item.name.toLowerCase() === lowerName,
    );
    if (isDuplicate) {
      return 'An exercise with this name already exists';
    }

    await createExercise(
      values.name,
      values.muscleGroupIds,
      values.classification,
      values.imageFilename ?? null,
    );

    await refresh();
    dialog.onClose();
    return null;
  };

  return {
    dialog,
    exercises,
    handleSave,
    openCreate,
    refresh,
  };
};
