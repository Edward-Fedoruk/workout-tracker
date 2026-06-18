import {
  addRoutineExercise,
  deleteRoutineExercise,
  reorderRoutineExercises,
  type RoutineWithExercises,
  setRoutineExerciseSetCount,
  updateRoutine,
  updateRoutineExercise,
} from '@/database';
import { type FormValues as ExerciseFormValues } from '@/routes/routines/RoutineExerciseForm.schema';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
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
      runStructural((routineId) => updateRoutine(routineId, name)),
    [runStructural],
  );

  const addExercise = useCallback(
    async (values: ExerciseFormValues): Promise<null | string> => {
      try {
        await runStructural((routineId) =>
          addRoutineExercise(
            routineId,
            values.name,
            values.sets,
            values.minReps,
            values.maxReps,
          ).then(() => undefined),
        );
        return null;
      } catch {
        return 'Failed to add exercise. Please try again.';
      }
    },
    [runStructural],
  );

  const editExercise = useCallback(
    async (id: number, values: ExerciseFormValues): Promise<null | string> => {
      try {
        await runStructural(() =>
          updateRoutineExercise(
            id,
            values.name,
            values.sets,
            values.minReps,
            values.maxReps,
          ),
        );
        return null;
      } catch {
        return 'Failed to save exercise. Please try again.';
      }
    },
    [runStructural],
  );

  const deleteExercise = useCallback(
    (id: number): Promise<void> =>
      runStructural((routineId) => deleteRoutineExercise(id, routineId)),
    [runStructural],
  );

  const addSet = useCallback(
    (exerciseId: number, currentCount: number): Promise<void> => {
      if (currentCount >= 5) {
        return Promise.resolve();
      }

      return runStructural(() =>
        setRoutineExerciseSetCount(exerciseId, currentCount + 1),
      );
    },
    [runStructural],
  );

  const removeSet = useCallback(
    (exerciseId: number, currentCount: number): Promise<void> => {
      if (currentCount <= 1) {
        return Promise.resolve();
      }

      return runStructural(() =>
        setRoutineExerciseSetCount(exerciseId, currentCount - 1),
      );
    },
    [runStructural],
  );

  const reorder = useCallback(
    (orderedIds: number[]): Promise<void> =>
      runStructural((routineId) =>
        reorderRoutineExercises(routineId, orderedIds),
      ),
    [runStructural],
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
