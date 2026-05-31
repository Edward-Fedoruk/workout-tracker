import { type ExerciseClassification } from '../../utils/erm';

export type FormErrors = {
  exerciseName?: string;
  general?: string;
  sets: SetErrors[];
  workoutDate?: string;
};

export type SetErrors = {
  reps?: string;
  weight?: string;
};

export type SetInput = {
  _key: string;
  reps: string;
  weight: string;
};

export const getToday = (): string => new Date().toISOString().slice(0, 10);

export const makeSetInput = (weight = '', reps = ''): SetInput => ({
  _key: crypto.randomUUID(),
  reps,
  weight,
});

const validateWeight = (
  rawWeight: string,
  classification: ExerciseClassification,
  bodyWeight: null | number,
): string | undefined => {
  const parsed = Number.parseFloat(rawWeight);
  const isEmpty = rawWeight.trim() === '';

  if (classification === 'standard') {
    if (isEmpty || !Number.isFinite(parsed) || parsed <= 0) {
      return 'Weight must be greater than 0';
    }

    return undefined;
  }

  if (classification === 'bodyweight') {
    if (!isEmpty && Number.isFinite(parsed) && parsed < 0) {
      return 'Weight must be 0 or greater';
    }

    if ((isEmpty || parsed === 0) && bodyWeight === null) {
      return 'Body weight not set — add it in Settings to log this exercise';
    }

    return undefined;
  }

  // assisted
  if (isEmpty && bodyWeight === null) {
    return 'Body weight not set — add it in Settings to log this exercise';
  }

  if (!isEmpty && !Number.isFinite(parsed)) {
    return 'Weight must be a number';
  }

  return undefined;
};

const validateReps = (rawReps: string): string | undefined => {
  const parsed = Number.parseInt(rawReps, 10);
  if (rawReps === '' || Number.isNaN(parsed) || parsed <= 0) {
    return 'Reps must be greater than 0';
  }

  return undefined;
};

export const validateWorkoutForm = (parameters: {
  bodyWeight: null | number;
  classification: ExerciseClassification;
  exerciseName: string;
  sets: SetInput[];
  workoutDate: string;
}): FormErrors => {
  const { bodyWeight, classification, exerciseName, sets, workoutDate } =
    parameters;
  const today = getToday();
  const errors: FormErrors = { sets: [] };

  if (workoutDate > today) {
    errors.workoutDate = 'Cannot log future workouts';
  }

  if (!exerciseName.trim()) {
    errors.exerciseName = 'Exercise name is required';
  }

  if (sets.length === 0) {
    errors.general = 'Must have at least 1 set';
  }

  for (const set of sets) {
    const setError: SetErrors = {};
    const weightError = validateWeight(set.weight, classification, bodyWeight);
    if (weightError !== undefined) {
      setError.weight = weightError;
    }

    const repsError = validateReps(set.reps);
    if (repsError !== undefined) {
      setError.reps = repsError;
    }

    errors.sets.push(setError);
  }

  return errors;
};

export const hasFormErrors = (errors: FormErrors): boolean => {
  return Boolean(
    errors.workoutDate ||
    errors.exerciseName ||
    errors.general ||
    errors.sets.some((setError) => setError.weight || setError.reps),
  );
};

export const getWeightInputMin = (
  classification: ExerciseClassification,
): string | undefined => {
  if (classification === 'standard') {
    return '0.1';
  }

  if (classification === 'bodyweight') {
    return '0';
  }

  return undefined;
};
