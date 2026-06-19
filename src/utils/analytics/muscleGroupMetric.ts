import { allSetsOf, bestErmOf, totalVolumeOf } from './aggregate';
import {
  type CalculationStrategy,
  createStrategyRegistry,
} from './strategyRegistry';
import { type AnalyticsSession } from './types';

/**
 * Strategies for a wind-rose spoke magnitude: how much a single muscle group
 * was trained in the selected period. The input is the sessions that touch the
 * group (an exercise mapped to several groups is fed to each group's calc).
 *
 * Default (`setCount`) is the number of sets performed for the group, so the
 * rose reflects training emphasis by volume of work rather than load. Swap to
 * `trainingVolume` (Σ effective weight × reps, body weight folded in) or any
 * other registered strategy via `setActive` without touching call sites.
 *
 * All strategies return a non-negative number (`0` for no qualifying data) so
 * the chart can render an empty/zero spoke without special-casing `null`.
 */

export type MuscleGroupMetricStrategy = CalculationStrategy<
  readonly AnalyticsSession[],
  number,
  MuscleGroupMetricStrategyKey
>;

export type MuscleGroupMetricStrategyKey =
  | 'bestErmSum'
  | 'sessionCount'
  | 'setCount'
  | 'trainingVolume';

const trainingVolume: MuscleGroupMetricStrategy = {
  calculate: (sessions) => totalVolumeOf(allSetsOf(sessions)),
  description: 'Total training volume (weight × reps) for the muscle group.',
  key: 'trainingVolume',
  label: 'Training volume',
};

const setCount: MuscleGroupMetricStrategy = {
  calculate: (sessions) => allSetsOf(sessions).length,
  description: 'Number of sets performed for the muscle group.',
  key: 'setCount',
  label: 'Set count',
};

const sessionCount: MuscleGroupMetricStrategy = {
  calculate: (sessions) => sessions.length,
  description: 'Number of workouts that trained the muscle group.',
  key: 'sessionCount',
  label: 'Session count',
};

const bestErmSum: MuscleGroupMetricStrategy = {
  calculate: (sessions) =>
    sessions.reduce(
      (total, session) => total + (bestErmOf(session.sets) ?? 0),
      0,
    ),
  description: 'Sum of each session’s best-set eRM for the muscle group.',
  key: 'bestErmSum',
  label: 'Sum of best-set eRMs',
};

export const muscleGroupMetricStrategies = createStrategyRegistry<
  readonly AnalyticsSession[],
  number,
  MuscleGroupMetricStrategyKey
>([trainingVolume, setCount, sessionCount, bestErmSum], 'setCount');
