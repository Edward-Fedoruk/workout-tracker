import { type AnalyticsSession, type AnalyticsSet } from './types';

/**
 * Small pure aggregation helpers shared by the calculation strategies.
 * Kept separate so each strategy reads as a one-liner over these primitives.
 */

/**
 * Finite, non-null eRM values from a list of sets.
 */
export const finiteErmsOf = (sets: readonly AnalyticsSet[]): number[] =>
  sets
    .map((set) => set.erm)
    .filter((erm): erm is number => erm !== null && Number.isFinite(erm));

/**
 * Highest eRM across the sets, or `null` when none are computable.
 */
export const bestErmOf = (sets: readonly AnalyticsSet[]): null | number => {
  const erms = finiteErmsOf(sets);

  return erms.length === 0 ? null : Math.max(...erms);
};

/**
 * Training volume for one set (effective weight × reps); `0` when unloaded.
 */
export const setVolumeOf = (set: AnalyticsSet): number => {
  const weight = set.effectiveWeight;

  if (weight === null || !Number.isFinite(weight) || weight <= 0) {
    return 0;
  }

  return weight * set.reps;
};

/**
 * Total training volume across a list of sets.
 */
export const totalVolumeOf = (sets: readonly AnalyticsSet[]): number =>
  sets.reduce((total, set) => total + setVolumeOf(set), 0);

/**
 * Flatten every set from a list of sessions.
 */
export const allSetsOf = (
  sessions: readonly AnalyticsSession[],
): AnalyticsSet[] => sessions.flatMap((session) => session.sets);

/**
 * Group every set by its exercise name across the given sessions.
 */
export const groupSetsByExercise = (
  sessions: readonly AnalyticsSession[],
): Map<string, AnalyticsSet[]> => {
  const byExercise = new Map<string, AnalyticsSet[]>();

  for (const session of sessions) {
    const existing = byExercise.get(session.exerciseName) ?? [];
    existing.push(...session.sets);
    byExercise.set(session.exerciseName, existing);
  }

  return byExercise;
};
