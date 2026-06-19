/**
 * Normalized inputs for analytics calculations.
 *
 * These shapes are intentionally decoupled from the database row types so the
 * calculation strategies stay pure and testable. A thin data-layer adapter is
 * responsible for mapping `WorkoutWithSets` (and the exercise classification +
 * stored body weight) into these shapes — including pre-computing
 * `effectiveWeight` via `computeEffectiveWeight` so bodyweight sets contribute
 * to volume-based metrics.
 */

/**
 * An `AnalyticsSetRow` fanned out per muscle group its exercise maps to, as
 * returned by `listMuscleGroupSetRowsInRange`. An exercise in N groups yields N
 * rows per set (intended multi-group attribution).
 */
export type AnalyticsMuscleGroupSetRow = AnalyticsSetRow & {
  muscleGroupColor: string;
  muscleGroupId: number;
  muscleGroupName: string;
};

/**
 * One exercise performed on one date, with all of its sets.
 */
export type AnalyticsSession = {
  exerciseName: string;
  isoDate: string;
  sets: AnalyticsSet[];
};

/**
 * A single logged set, normalized for analytics calculations.
 */
export type AnalyticsSet = {
  /**
   * Bodyweight-adjusted weight used for volume metrics; `null` when unknown.
   */
  effectiveWeight: null | number;
  /**
   * Stored estimated 1-rep max for the set; `null` when not computable.
   */
  erm: null | number;
  reps: number;
  setNumber: number;
  /**
   * Raw logged weight; `null` for bodyweight sets without added load.
   */
  weight: null | number;
};

/**
 * One logged set joined with its session + exercise classification, as returned
 * by `listSetRowsInRange`. The adapter (`sessionsFromSetRows`) groups these by
 * `workoutId` into `AnalyticsSession`s, computing `effectiveWeight` per set.
 */
export type AnalyticsSetRow = {
  classification: 'bodyweight' | 'standard';
  ermValue: null | number;
  exerciseName: string;
  isoDate: string;
  reps: number;
  setNumber: number;
  weight: null | number;
  workoutId: number;
};
