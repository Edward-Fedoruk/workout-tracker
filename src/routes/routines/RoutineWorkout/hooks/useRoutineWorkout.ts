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

  const load = async (routineId: number): Promise<boolean> => {
    const [data, bw, exerciseList, draft] = await Promise.all([
      getRoutineById(routineId),
      getBodyWeight(),
      listExercises(),
      getDraft(),
    ]);

    if (!data) {
      setIsLoading(false);
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
    setIsLoading(false);
    return true;
  };

  // Serialise the current form values into the singleton draft. NaN (empty
  // numeric field) is stored as null. Best-effort — failures are swallowed so a
  // draft-write error never blocks the user from logging.
  const autoSave = useCallback(
    (values: FormValues) => {
      if (!routine) {
        return;
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
          weight: Number.isNaN(set.weight) ? null : set.weight,
        }));
      }

      saveDraft(routine.id, data).catch(() => undefined);
    },
    [routine],
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
            const weight = Number.isNaN(set.weight) ? null : set.weight;
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
    routine,
    submit,
  };
};
