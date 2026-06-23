import { useToggle } from '@/hooks/useToggle';
import { type FormValues } from '@/routes/exercises/Exercise/ExerciseForm/schema';
import {
  useCreateExerciseMutation,
  useListExercisesQuery,
} from '@/store/entities/exercises';

export type UseExercisesReturn = ReturnType<typeof useExercises>;

export const useExercises = () => {
  const { data: exercises = [] } = useListExercisesQuery();
  const [createExercise] = useCreateExerciseMutation();

  const dialog = useToggle();

  // Cache invalidation keeps the list fresh; kept as a resolved no-op so the
  // view's mount-time call and post-delete refresh stay valid (HR-2).
  const refresh = async (): Promise<void> => undefined;

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

    await createExercise({
      classification: values.classification,
      imageFilename: values.imageFilename ?? null,
      muscleGroupIds: values.muscleGroupIds,
      name: values.name,
    }).unwrap();

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
