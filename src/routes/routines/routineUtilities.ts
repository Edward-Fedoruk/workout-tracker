export const validateRoutineName = (name: string): null | string => {
  if (name.trim().length === 0) {
    return 'Name is required';
  }

  if (name.trim().length > 100) {
    return 'Name must be 100 characters or fewer';
  }

  return null;
};

export const validateExercise = (
  name: string,
  sets: number,
  minReps: number,
  maxReps: number,
): { maxReps?: string; minReps?: string; name?: string; sets?: string } => {
  const errors: {
    maxReps?: string;
    minReps?: string;
    name?: string;
    sets?: string;
  } = {};
  if (name.trim().length === 0) {
    errors.name = 'Exercise name is required';
  }

  if (!Number.isInteger(sets) || sets < 1 || sets > 5) {
    errors.sets = 'Sets must be between 1 and 5';
  }

  if (!Number.isInteger(minReps) || minReps < 1 || minReps > 99) {
    errors.minReps = 'Min reps must be between 1 and 99';
  }

  if (!Number.isInteger(maxReps) || maxReps < 1 || maxReps > 99) {
    errors.maxReps = 'Max reps must be between 1 and 99';
  }

  if (!errors.minReps && !errors.maxReps && minReps > maxReps) {
    errors.maxReps = 'Max reps must be ≥ min reps';
  }

  return errors;
};

export const formatRepRange = (minReps: number, maxReps: number): string =>
  minReps === maxReps ? `${minReps} reps` : `${minReps}–${maxReps} reps`;
