import {
  createWorkout,
  type Exercise,
  getBodyWeight,
  getLastExerciseSets,
  getRoutineById,
  type LastExerciseSets,
  listExercises,
  type RoutineExercise,
  type RoutineWithExercises,
} from '../../../../database';
import { computeEffectiveWeight, computeERM } from '../../../../utils/erm';
import { type FormValues } from '../RoutineWorkoutForm.schema';
import { useState } from 'react';

export type UseRoutineWorkoutReturn = ReturnType<typeof useRoutineWorkout>;

export const useRoutineWorkout = () => {
  const [routine, setRoutine] = useState<null | RoutineWithExercises>(null);
  const [prefills, setPrefills] = useState<Map<number, LastExerciseSets>>(
    new Map(),
  );
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeight, setBodyWeight] = useState<null | number>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const load = async (routineId: number): Promise<boolean> => {
    const [data, bw, exerciseList] = await Promise.all([
      getRoutineById(routineId),
      getBodyWeight(),
      listExercises(),
    ]);

    if (!data) {
      setIsLoading(false);
      return false;
    }

    setRoutine(data);
    setBodyWeight(bw);
    setExercises(exerciseList);

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

      return true;
    } catch {
      setError('Failed to save workout. Please try again.');
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    bodyWeight,
    error,
    exercises,
    isLoading,
    isSubmitting,
    load,
    prefills,
    routine,
    submit,
  };
};
