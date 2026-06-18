import {
  type Exercise,
  type LastExerciseSets,
  type RoutineWithExercises,
  type StoredDraftData,
} from '@/database';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';

/**
 * Build the react-hook-form values as a pure projection of
 * (routine structure + draft + last-time prefills). The draft is keyed by
 * `routineExercise.id`, so entered values survive reorder and set-count changes.
 */
export const buildFormValues = (
  routine: RoutineWithExercises,
  draftData: null | StoredDraftData,
  prefills: Map<number, LastExerciseSets>,
  exercises: Exercise[],
  bodyWeight: null | number,
): FormValues => ({
  bodyWeight,
  exercises: routine.exercises.map((routineExercise) => {
    const saved = draftData?.[String(routineExercise.id)];
    const prefill = prefills.get(routineExercise.id);
    return {
      classification:
        exercises.find((option) => option.name === routineExercise.exerciseName)
          ?.classification ?? 'standard',
      exerciseName: routineExercise.exerciseName,
      sets: Array.from(
        { length: routineExercise.suggestedSets },
        (_unused, setIndex) => {
          const savedSet = saved?.[setIndex];
          const prefillEntry = prefill?.[setIndex];
          const hasNoSaved =
            savedSet === undefined ||
            (savedSet.reps === null && savedSet.weight === null);
          return {
            completed: savedSet?.completed ?? false,
            reps:
              savedSet?.reps !== null && savedSet?.reps !== undefined
                ? savedSet.reps
                : hasNoSaved && prefillEntry !== undefined
                  ? prefillEntry.reps
                  : Number.NaN,
            weight:
              savedSet?.weight !== null && savedSet?.weight !== undefined
                ? savedSet.weight
                : hasNoSaved &&
                    prefillEntry?.weight !== null &&
                    prefillEntry !== undefined
                  ? prefillEntry.weight
                  : '',
          };
        },
      ),
    };
  }),
});
