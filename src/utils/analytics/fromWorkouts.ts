import {
  type AnalyticsMuscleGroupSetRow,
  type AnalyticsSession,
  type AnalyticsSet,
  type AnalyticsSetRow,
} from './types';
import { computeEffectiveWeight } from '@/utils/erm';

/**
 * Pure adapters from flat read-layer rows to the normalized analytics shapes
 * the strategies consume. No DB import — kept independently testable.
 */

const toSet = (
  row: AnalyticsSetRow,
  bodyWeight: null | number,
): AnalyticsSet => ({
  effectiveWeight: computeEffectiveWeight({
    bodyWeight,
    classification: row.classification,
    loggedWeight: row.weight,
  }),
  erm: row.ermValue,
  reps: row.reps,
  setNumber: row.setNumber,
  weight: row.weight,
});

/**
 * Group flat set rows into sessions (by `workoutId`), computing each set's
 * bodyweight-adjusted `effectiveWeight`. Rows are assumed ordered by date/id;
 * the resulting sessions preserve first-seen order.
 */
export const sessionsFromSetRows = (
  rows: AnalyticsSetRow[],
  bodyWeight: null | number,
): AnalyticsSession[] => {
  const byWorkout = new Map<number, AnalyticsSession>();

  for (const row of rows) {
    let session = byWorkout.get(row.workoutId);

    if (!session) {
      session = {
        exerciseName: row.exerciseName,
        isoDate: row.isoDate,
        sets: [],
      };
      byWorkout.set(row.workoutId, session);
    }

    session.sets.push(toSet(row, bodyWeight));
  }

  return [...byWorkout.values()];
};

/**
 * Group muscle-group set rows by group, each with its attributed sessions. An
 * exercise mapped to several groups contributes to each (rows are pre-fanned by
 * the query), so no de-duplication happens here.
 */
export const musclesFromSetRows = (
  rows: AnalyticsMuscleGroupSetRow[],
  bodyWeight: null | number,
): Array<{
  color: string;
  id: number;
  name: string;
  sessions: AnalyticsSession[];
}> => {
  const byGroup = new Map<number, AnalyticsMuscleGroupSetRow[]>();

  for (const row of rows) {
    const existing = byGroup.get(row.muscleGroupId) ?? [];
    existing.push(row);
    byGroup.set(row.muscleGroupId, existing);
  }

  return [...byGroup.values()].flatMap((groupRows) => {
    const [first] = groupRows;

    if (!first) {
      return [];
    }

    return [
      {
        color: first.muscleGroupColor,
        id: first.muscleGroupId,
        name: first.muscleGroupName,
        sessions: sessionsFromSetRows(groupRows, bodyWeight),
      },
    ];
  });
};
