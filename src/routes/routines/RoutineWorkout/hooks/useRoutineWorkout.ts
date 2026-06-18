import {
  clearDraft,
  createWorkout,
  type Exercise,
  getBodyWeight,
  getDraft,
  getLastExerciseSets,
  getRoutineById,
  type LastExerciseSets,
  listExercises,
  type RoutineExercise,
  type RoutineWithExercises,
  saveDraft,
  type StoredDraftData,
} from '@/database';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import { computeEffectiveWeight, computeERM } from '@/utils/erm';
import { useCallback, useMemo, useState } from 'react';

export type UseRoutineWorkoutReturn = ReturnType<typeof useRoutineWorkout>;

export const useRoutineWorkout = () => {
  const [routine, setRoutine] = useState<null | RoutineWithExercises>(null);
  const [prefills, setPrefills] = useState<Map<number, LastExerciseSets>>(
    new Map(),
  );
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeight, setBodyWeight] = useState<null | number>(null);
  const [draftData, setDraftData] = useState<null | StoredDraftData>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // Re-fetch routine + prefills + draft and update state. Shared by the initial
  // load and by reload() after a structural mutation. Does not touch isLoading.
  const fetchInto = async (routineId: number): Promise<boolean> => {
    const [data, bw, exerciseList, draft] = await Promise.all([
      getRoutineById(routineId),
      getBodyWeight(),
      listExercises(),
      getDraft(),
    ]);

    if (!data) {
      return false;
    }

    setRoutine(data);
    setBodyWeight(bw);
    setExercises(exerciseList);

    // Restore saved values only when the draft belongs to this routine.
    setDraftData(
      draft && draft.routineId === routineId ? draft.draftData : null,
    );

    const prefillMap = new Map<number, LastExerciseSets>();
    await Promise.all(
      data.exercises.map(async (exercise: RoutineExercise) => {
        const sets = await getLastExerciseSets(
          exercise.exerciseName,
          exercise.suggestedSets,
        );
        prefillMap.set(exercise.id, sets);
      }),
    );
    setPrefills(prefillMap);
    return true;
  };

  const load = async (routineId: number): Promise<boolean> => {
    const found = await fetchInto(routineId);
    setIsLoading(false);
    return found;
  };

  // Re-project state after a structural edit, without the loading spinner.
  const reload = useCallback(async (routineId: number): Promise<void> => {
    await fetchInto(routineId);
  }, []);

  // Serialise the current form values into the draft shape (keyed by
  // routineExercise.id). NaN/'' numeric fields become null.
  const serialiseDraft = useCallback(
    (values: FormValues): null | StoredDraftData => {
      if (!routine) {
        return null;
      }

      const data: StoredDraftData = {};
      for (const [index, exercise] of values.exercises.entries()) {
        const routineExerciseId = routine.exercises[index]?.id;
        if (routineExerciseId === undefined) {
          continue;
        }

        data[String(routineExerciseId)] = exercise.sets.map((set) => ({
          completed: set.completed,
          reps: Number.isNaN(set.reps) ? null : set.reps,
          weight:
            Number.isNaN(set.weight) || set.weight === '' ? null : set.weight,
        }));
      }

      return data;
    },
    [routine],
  );

  // Best-effort blur-time persistence — failures are swallowed so a draft-write
  // error never blocks the user from logging.
  const autoSave = useCallback(
    (values: FormValues) => {
      const data = serialiseDraft(values);
      if (routine && data) {
        saveDraft(routine.id, data).catch(() => undefined);
      }
    },
    [routine, serialiseDraft],
  );

  // Awaitable draft save used before structural mutations so a subsequent reload
  // rehydrates the latest typed values.
  const saveDraftNow = useCallback(
    async (values: FormValues): Promise<void> => {
      const data = serialiseDraft(values);
      if (routine && data) {
        await saveDraft(routine.id, data);
      }
    },
    [routine, serialiseDraft],
  );

  const discardDraft = useCallback(async (): Promise<void> => {
    await clearDraft();
  }, []);

  const submit = async (values: FormValues): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      for (const exercise of values.exercises) {
        const filledSets = exercise.sets
          .filter(
            (set) => !(Number.isNaN(set.reps) && Number.isNaN(set.weight)),
          )
          .map((set) => {
            const weight =
              Number.isNaN(set.weight) || set.weight === '' ? null : set.weight;
            const effective = computeEffectiveWeight({
              bodyWeight: values.bodyWeight,
              classification: exercise.classification,
              loggedWeight: weight,
            });
            const erm =
              effective === null ? null : computeERM(effective, set.reps);
            return { erm, reps: set.reps, weight };
          });

        if (filledSets.length > 0) {
          await createWorkout(today, exercise.exerciseName, filledSets);
        }
      }

      // Workout logged — the draft has served its purpose.
      await clearDraft();
      return true;
    } catch {
      setError('Failed to save workout. Please try again.');
      setIsSubmitting(false);
      return false;
    }
  };

  const exerciseImageMap = useMemo(
    () =>
      new Map<string, string | undefined>(
        exercises.map((exercise) => [
          exercise.name,
          exercise.imageFilename ?? undefined,
        ]),
      ),
    [exercises],
  );

  return {
    autoSave,
    bodyWeight,
    discardDraft,
    draftData,
    error,
    exerciseImageMap,
    exercises,
    isLoading,
    isSubmitting,
    load,
    prefills,
    reload,
    routine,
    saveDraftNow,
    submit,
  };
};
