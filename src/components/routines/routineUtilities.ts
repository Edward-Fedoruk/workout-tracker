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
  reps: number,
): { name?: string; reps?: string; sets?: string } => {
  const errors: { name?: string; reps?: string; sets?: string } = {};
  if (name.trim().length === 0) {
    errors.name = 'Exercise name is required';
  }

  if (!Number.isInteger(sets) || sets < 1 || sets > 5) {
    errors.sets = 'Sets must be between 1 and 5';
  }

  if (!Number.isInteger(reps) || reps < 1 || reps > 99) {
    errors.reps = 'Reps must be between 1 and 99';
  }

  return errors;
};
