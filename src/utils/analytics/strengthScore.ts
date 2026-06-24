import {
  allSetsOf,
  bestErmOf,
  groupSetsByExercise,
  setVolumeOf,
  totalVolumeOf,
} from './aggregate';
import {
  type CalculationStrategy,
  createStrategyRegistry,
} from './strategyRegistry';
import { type AnalyticsSession } from './types';

/**
 * Strategies for the weekly "overall strength" score (one number summarizing a
 * week's training across all exercises). The week-over-week percentage compares
 * two weekly scores.
 *
 * Default (`sumOfBestErm`) is per the spec clarification: each week's score is
 * the sum, across all exercises trained that week, of that exercise's best-set
 * eRM. Because it sums totals, gains on some lifts and losses on others net out
 * into one direction.
 *
 * Note that the per-week score sums every exercise trained that week. The
 * week-over-week comparison (`computeStrengthProgress`) restricts both weeks to
 * the exercises they have in common before scoring, so skipping an exercise (or
 * training a different one) never reads as "weaker" — see that function.
 */

export type StrengthScoreStrategy = CalculationStrategy<
  readonly AnalyticsSession[],
  null | number,
  StrengthScoreStrategyKey
>;

export type StrengthScoreStrategyKey =
  | 'sumOfBestErm'
  | 'sumOfBestVolume'
  | 'totalVolume';

const sumOfBestErm: StrengthScoreStrategy = {
  calculate: (sessions) => {
    const byExercise = groupSetsByExercise(sessions);
    let total = 0;
    let counted = 0;

    for (const sets of byExercise.values()) {
      const best = bestErmOf(sets);

      if (best !== null) {
        total += best;
        counted += 1;
      }
    }

    return counted === 0 ? null : total;
  },
  description:
    'Sum across all exercises of each exercise’s best-set eRM for the week.',
  key: 'sumOfBestErm',
  label: 'Sum of best-set eRMs',
};

const sumOfBestVolume: StrengthScoreStrategy = {
  calculate: (sessions) => {
    const byExercise = groupSetsByExercise(sessions);

    if (byExercise.size === 0) {
      return null;
    }

    let total = 0;

    for (const sets of byExercise.values()) {
      total += Math.max(0, ...sets.map((set) => setVolumeOf(set)));
    }

    return total;
  },
  description:
    'Sum across all exercises of each exercise’s best single-set volume.',
  key: 'sumOfBestVolume',
  label: 'Sum of best-set volume',
};

const totalVolume: StrengthScoreStrategy = {
  calculate: (sessions) => {
    const sets = allSetsOf(sessions);

    return sets.length === 0 ? null : totalVolumeOf(sets);
  },
  description: 'Total training volume (weight × reps) across every set.',
  key: 'totalVolume',
  label: 'Total volume',
};

export const strengthScoreStrategies = createStrategyRegistry<
  readonly AnalyticsSession[],
  null | number,
  StrengthScoreStrategyKey
>([sumOfBestErm, sumOfBestVolume, totalVolume], 'sumOfBestErm');

export type WeekOverWeekDirection =
  | 'insufficient'
  | 'same'
  | 'stronger'
  | 'weaker';

export type WeekOverWeekResult = {
  /**
   * Current week's score, or `null` when not computable.
   */
  current: null | number;
  direction: WeekOverWeekDirection;
  /**
   * Signed percentage change vs. the previous week; `null` when undefined.
   */
  percentChange: null | number;
  /**
   * Previous week's score, or `null` when not computable.
   */
  previous: null | number;
};

/**
 * Below this absolute percentage, weeks are treated as equally strong.
 */
const SAME_THRESHOLD_PERCENT = 0.05;

/**
 * Compare two weekly scores into a home-screen-ready result. Returns an
 * `insufficient` direction (and `null` percentage) when either week lacks a
 * usable score, so callers can show a neutral state instead of a fake number.
 */
export const computeWeekOverWeekChange = (
  current: null | number,
  previous: null | number,
): WeekOverWeekResult => {
  if (current === null || previous === null || previous <= 0) {
    return {
      current,
      direction: 'insufficient',
      percentChange: null,
      previous,
    };
  }

  const percentChange = ((current - previous) / previous) * 100;
  let direction: WeekOverWeekDirection = 'same';

  if (percentChange > SAME_THRESHOLD_PERCENT) {
    direction = 'stronger';
  } else if (percentChange < -SAME_THRESHOLD_PERCENT) {
    direction = 'weaker';
  }

  return { current, direction, percentChange, previous };
};

/**
 * Sessions whose exercise was trained in both weeks. Comparing only the shared
 * exercises keeps the week-over-week change apples-to-apples: an exercise done
 * in just one week (skipped this week, or newly added) is excluded from both
 * sides so it can neither inflate nor deflate the comparison.
 */
const restrictToCommonExercises = (
  currentWeekSessions: readonly AnalyticsSession[],
  previousWeekSessions: readonly AnalyticsSession[],
): {
  current: AnalyticsSession[];
  previous: AnalyticsSession[];
} => {
  const previousExercises = new Set(
    previousWeekSessions.map((session) => session.exerciseName),
  );
  const currentExercises = new Set(
    currentWeekSessions.map((session) => session.exerciseName),
  );

  return {
    current: currentWeekSessions.filter((session) =>
      previousExercises.has(session.exerciseName),
    ),
    previous: previousWeekSessions.filter((session) =>
      currentExercises.has(session.exerciseName),
    ),
  };
};

/**
 * Convenience for the home-screen indicator: score both weeks with the given
 * strategy (active by default) and compare them. Only exercises trained in both
 * weeks are scored, so dropping or swapping an exercise never reads as a
 * strength change. When the weeks share no exercises, neither has a score and
 * the result is `insufficient`.
 */
export const computeStrengthProgress = (
  currentWeekSessions: readonly AnalyticsSession[],
  previousWeekSessions: readonly AnalyticsSession[],
  strategy: StrengthScoreStrategy = strengthScoreStrategies.getActive(),
): WeekOverWeekResult => {
  const { current, previous } = restrictToCommonExercises(
    currentWeekSessions,
    previousWeekSessions,
  );

  return computeWeekOverWeekChange(
    strategy.calculate(current),
    strategy.calculate(previous),
  );
};
