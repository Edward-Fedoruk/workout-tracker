import { type RoutineWithExercises } from '@/database';
import { type FormValues as ExerciseFormValues } from '@/routes/routines/RoutineExerciseForm.schema';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import {
  useAddRoutineExerciseMutation,
  useDeleteRoutineExerciseMutation,
  useReorderRoutineExercisesMutation,
  useSetRoutineExerciseSetCountMutation,
  useUpdateRoutineExerciseMutation,
  useUpdateRoutineMutation,
} from '@/store/entities/routines';
import { useCallback, useState } from 'react';

export type UseRoutineStructureParameters = {
  readonly getCurrentValues: () => FormValues | null;
  readonly reload: (routineId: number) => Promise<void>;
  readonly routine: null | RoutineWithExercises;
  readonly saveDraftNow: (values: FormValues) => Promise<void>;
};

export type UseRoutineStructureReturn = ReturnType<typeof useRoutineStructure>;

export const useRoutineStructure = ({
  getCurrentValues,
  reload,
  routine,
  saveDraftNow,
}: UseRoutineStructureParameters) => {
  const [structureVersion, setStructureVersion] = useState(0);

  const [updateRoutine] = useUpdateRoutineMutation();
  const [addRoutineExercise] = useAddRoutineExerciseMutation();
  const [updateRoutineExercise] = useUpdateRoutineExerciseMutation();
  const [deleteRoutineExercise] = useDeleteRoutineExerciseMutation();
  const [setRoutineExerciseSetCount] = useSetRoutineExerciseSetCountMutation();
  const [reorderRoutineExercises] = useReorderRoutineExercisesMutation();

  // autosave current form → mutate routine template → reload → bump version.
  const runStructural = useCallback(
    async (mutate: (routineId: number) => Promise<void>): Promise<void> => {
      if (!routine) {
        return;
      }

      const values = getCurrentValues();
      if (values) {
        await saveDraftNow(values);
      }

      await mutate(routine.id);
      await reload(routine.id);
      setStructureVersion((version) => version + 1);
    },
    [getCurrentValues, reload, routine, saveDraftNow],
  );

  const rename = useCallback(
    (name: string): Promise<void> =>
      runStructural(async (routineId) => {
        await updateRoutine({ id: routineId, name }).unwrap();
      }),
    [runStructural, updateRoutine],
  );

  const addExercise = useCallback(
    async (values: ExerciseFormValues): Promise<null | string> => {
      try {
        await runStructural(async (routineId) => {
          await addRoutineExercise({
            exerciseName: values.name,
            maxReps: values.maxReps,
            minReps: values.minReps,
            routineId,
            suggestedSets: values.sets,
          }).unwrap();
        });
        return null;
      } catch {
        return 'Failed to add exercise. Please try again.';
      }
    },
    [addRoutineExercise, runStructural],
  );

  const editExercise = useCallback(
    async (id: number, values: ExerciseFormValues): Promise<null | string> => {
      try {
        await runStructural(async () => {
          await updateRoutineExercise({
            exerciseName: values.name,
            id,
            maxReps: values.maxReps,
            minReps: values.minReps,
            suggestedSets: values.sets,
          }).unwrap();
        });
        return null;
      } catch {
        return 'Failed to save exercise. Please try again.';
      }
    },
    [runStructural, updateRoutineExercise],
  );

  const deleteExercise = useCallback(
    (id: number): Promise<void> =>
      runStructural(async (routineId) => {
        await deleteRoutineExercise({ id, routineId }).unwrap();
      }),
    [deleteRoutineExercise, runStructural],
  );

  const addSet = useCallback(
    (exerciseId: number, currentCount: number): Promise<void> => {
      if (currentCount >= 5) {
        return Promise.resolve();
      }

      return runStructural(async () => {
        await setRoutineExerciseSetCount({
          id: exerciseId,
          suggestedSets: currentCount + 1,
        }).unwrap();
      });
    },
    [runStructural, setRoutineExerciseSetCount],
  );

  const removeSet = useCallback(
    (exerciseId: number, currentCount: number): Promise<void> => {
      if (currentCount <= 1) {
        return Promise.resolve();
      }

      return runStructural(async () => {
        await setRoutineExerciseSetCount({
          id: exerciseId,
          suggestedSets: currentCount - 1,
        }).unwrap();
      });
    },
    [runStructural, setRoutineExerciseSetCount],
  );

  const reorder = useCallback(
    (orderedIds: number[]): Promise<void> =>
      runStructural(async (routineId) => {
        await reorderRoutineExercises({ orderedIds, routineId }).unwrap();
      }),
    [reorderRoutineExercises, runStructural],
  );

  return {
    addExercise,
    addSet,
    deleteExercise,
    editExercise,
    removeSet,
    rename,
    reorder,
    structureVersion,
  };
};
