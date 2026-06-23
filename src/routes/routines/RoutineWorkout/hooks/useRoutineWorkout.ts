import {
  getLastExerciseSets,
  type LastExerciseSets,
  type RoutineExercise,
  type StoredDraftData,
} from '@/database';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import {
  useClearDraftMutation,
  useLazyGetDraftQuery,
  useSaveDraftMutation,
} from '@/store/entities/draft';
import { useListExercisesQuery } from '@/store/entities/exercises';
import { useLazyGetRoutineQuery } from '@/store/entities/routines';
import { useGetBodyWeightQuery } from '@/store/entities/settings';
import { useCreateWorkoutMutation } from '@/store/entities/workouts';
import { computeEffectiveWeight, computeERM } from '@/utils/erm';
import { useCallback, useMemo, useState } from 'react';

export type UseRoutineWorkoutReturn = ReturnType<typeof useRoutineWorkout>;

export const useRoutineWorkout = () => {
  const [triggerGetRoutine, routineResult] = useLazyGetRoutineQuery();
  const [triggerGetDraft] = useLazyGetDraftQuery();
  const bodyWeightQuery = useGetBodyWeightQuery();
  const exercisesQuery = useListExercisesQuery();

  const [saveDraftMutation] = useSaveDraftMutation();
  const [clearDraftMutation] = useClearDraftMutation();
  const [createWorkout] = useCreateWorkoutMutation();

  const routine = routineResult.data ?? null;
  const bodyWeight = bodyWeightQuery.data ?? null;
  const exercises = useMemo(
    () => exercisesQuery.data ?? [],
    [exercisesQuery.data],
  );

  const [prefills, setPrefills] = useState<Map<number, LastExerciseSets>>(
    new Map(),
  );
  const [draftData, setDraftData] = useState<null | StoredDraftData>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // Re-fetch routine + prefills + draft from the cache and update local state.
  // Shared by the initial load and by reload() after a structural mutation.
  // Reads the draft once (not via a live subscription) so blur-time autosaves
  // never reseed the form mid-edit. Does not touch isLoading.
  const fetchInto = useCallback(
    async (routineId: number): Promise<boolean> => {
      const data = await triggerGetRoutine(routineId).unwrap();
      if (!data) {
        return false;
      }

      const draft = await triggerGetDraft().unwrap();

      // Restore saved values only when the draft belongs to this routine.
      setDraftData(
        draft && draft.routineId === routineId ? draft.draftData : null,
      );

      const prefillMap = new Map<number, LastExerciseSets>();
      await Promise.all(
        data.exercises.map(async (exercise: RoutineExercise) => {
          // getLastExerciseSets is an on-demand workflow lookup, not a
          // view-backing list — it stays a direct @/database call (HR-6).
          const sets = await getLastExerciseSets(
            exercise.exerciseName,
            exercise.suggestedSets,
          );
          prefillMap.set(exercise.id, sets);
        }),
      );
      setPrefills(prefillMap);
      return true;
    },
    [triggerGetDraft, triggerGetRoutine],
  );

  const load = async (routineId: number): Promise<boolean> => {
    const found = await fetchInto(routineId);
    setIsLoading(false);
    return found;
  };

  // Re-project state after a structural edit, without the loading spinner.
  const reload = useCallback(
    async (routineId: number): Promise<void> => {
      await fetchInto(routineId);
    },
    [fetchInto],
  );

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
        saveDraftMutation({ data, routineId: routine.id })
          .unwrap()
          .catch(() => undefined);
      }
    },
    [routine, saveDraftMutation, serialiseDraft],
  );

  // Awaitable draft save used before structural mutations so a subsequent reload
  // rehydrates the latest typed values.
  const saveDraftNow = useCallback(
    async (values: FormValues): Promise<void> => {
      const data = serialiseDraft(values);
      if (routine && data) {
        await saveDraftMutation({ data, routineId: routine.id }).unwrap();
      }
    },
    [routine, saveDraftMutation, serialiseDraft],
  );

  const discardDraft = useCallback(async (): Promise<void> => {
    await clearDraftMutation().unwrap();
  }, [clearDraftMutation]);

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
          await createWorkout({
            exerciseName: exercise.exerciseName,
            sets: filledSets,
            workoutDate: today,
          }).unwrap();
        }
      }

      // Workout logged — the draft has served its purpose.
      await clearDraftMutation().unwrap();
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
