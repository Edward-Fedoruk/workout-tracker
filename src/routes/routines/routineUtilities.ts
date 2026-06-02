export const formatRepRange = (minReps: number, maxReps: number): string =>
  minReps === maxReps ? `${minReps} reps` : `${minReps}–${maxReps} reps`;
