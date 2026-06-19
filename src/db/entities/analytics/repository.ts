import { getDatabaseId, getPromiser } from '@/db/driver';
import {
  type AnalyticsMuscleGroupSetRow,
  type AnalyticsSetRow,
} from '@/utils/analytics/types';

/**
 * Read-only analytics queries. One row per logged set (optionally fanned out per
 * muscle group), filtered by an inclusive `workout_date` range. Parameterized
 * `?` binds only; no schema change and no write path.
 */
class AnalyticsRepository {
  async listMuscleGroupSetRowsInRange(
    startIso: string,
    endIso: string,
  ): Promise<AnalyticsMuscleGroupSetRow[]> {
    const promiser = await getPromiser();
    const result = await promiser<AnalyticsMuscleGroupSetRow>('exec', {
      bind: [startIso, endIso],
      dbId: getDatabaseId(),
      rowMode: 'object',
      sql: `
        SELECT
          w.id            AS workoutId,
          w.workout_date  AS isoDate,
          w.exercise_name AS exerciseName,
          COALESCE(e.classification, 'standard') AS classification,
          s.set_number    AS setNumber,
          s.reps          AS reps,
          s.weight        AS weight,
          s.erm           AS ermValue,
          mg.id           AS muscleGroupId,
          mg.name         AS muscleGroupName,
          mg.color        AS muscleGroupColor
        FROM workout_log w
        JOIN workout_set s ON s.workout_id = w.id
        JOIN exercise e ON e.name = w.exercise_name
        JOIN exercise_muscle_group emg ON emg.exercise_id = e.id
        JOIN muscle_group mg ON mg.id = emg.muscle_group_id
        WHERE w.workout_date >= ? AND w.workout_date <= ?
        ORDER BY w.workout_date ASC, w.id ASC, s.set_number ASC
      `,
    });

    return result.result.resultRows || [];
  }

  async listSetRowsInRange(
    startIso: string,
    endIso: string,
  ): Promise<AnalyticsSetRow[]> {
    const promiser = await getPromiser();
    const result = await promiser<AnalyticsSetRow>('exec', {
      bind: [startIso, endIso],
      dbId: getDatabaseId(),
      rowMode: 'object',
      sql: `
        SELECT
          w.id            AS workoutId,
          w.workout_date  AS isoDate,
          w.exercise_name AS exerciseName,
          COALESCE(e.classification, 'standard') AS classification,
          s.set_number    AS setNumber,
          s.reps          AS reps,
          s.weight        AS weight,
          s.erm           AS ermValue
        FROM workout_log w
        JOIN workout_set s ON s.workout_id = w.id
        LEFT JOIN exercise e ON e.name = w.exercise_name
        WHERE w.workout_date >= ? AND w.workout_date <= ?
        ORDER BY w.workout_date ASC, w.id ASC, s.set_number ASC
      `,
    });

    return result.result.resultRows || [];
  }
}

export const analyticsRepository = new AnalyticsRepository();
