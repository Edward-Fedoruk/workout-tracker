import { workoutLog } from './schema';
import { type WorkoutTableRow, type WorkoutWithSets } from './types';
import { getDatabaseId, getPromiser } from '@/db/driver';
import { workoutSetRepository } from '@/db/entities/workout-set/repository';
import { workoutSet } from '@/db/entities/workout-set/schema';
import { database } from '@/db/orm';
import { eq, sql } from 'drizzle-orm';

class WorkoutLogRepository {
  async create(
    workoutDate: string,
    exerciseName: string,
    sets: Array<{ erm: null | number; reps: number; weight: null | number }>,
  ): Promise<number> {
    const inserted = await database
      .insert(workoutLog)
      .values({ exerciseName, workoutDate })
      .returning({ id: workoutLog.id });

    const id = inserted[0]?.id;
    if (id === undefined) {
      throw new Error('INSERT workout_log failed: no row returned');
    }

    await workoutSetRepository.insertMany(id, sets);
    return id;
  }

  async delete(id: number): Promise<void> {
    await workoutSetRepository.deleteByWorkoutId(id);
    await database.delete(workoutLog).where(eq(workoutLog.id, id));
  }

  async getById(id: number): Promise<null | WorkoutWithSets> {
    const workouts = await database
      .select()
      .from(workoutLog)
      .where(eq(workoutLog.id, id));

    const workout = workouts[0];
    if (!workout) {
      return null;
    }

    const sets = await database
      .select()
      .from(workoutSet)
      .where(eq(workoutSet.workoutId, id))
      .orderBy(workoutSet.setNumber);

    return { ...workout, sets };
  }

  // Raw MAX(CASE) pivot query — not expressible in Drizzle's query builder.
  async list(): Promise<WorkoutTableRow[]> {
    const promiser = await getPromiser();
    const result = await promiser<WorkoutTableRow>('exec', {
      dbId: getDatabaseId(),
      rowMode: 'object',
      sql: `
        SELECT
          w.id,
          w.workout_date,
          w.exercise_name,
          e.image_filename AS exercise_image_filename,
          MAX(CASE WHEN s.set_number = 1 THEN s.weight END) AS Set1_weight,
          MAX(CASE WHEN s.set_number = 1 THEN s.reps   END) AS Set1_reps,
          MAX(CASE WHEN s.set_number = 1 THEN s.erm    END) AS Set1_erm,
          MAX(CASE WHEN s.set_number = 2 THEN s.weight END) AS Set2_weight,
          MAX(CASE WHEN s.set_number = 2 THEN s.reps   END) AS Set2_reps,
          MAX(CASE WHEN s.set_number = 2 THEN s.erm    END) AS Set2_erm,
          MAX(CASE WHEN s.set_number = 3 THEN s.weight END) AS Set3_weight,
          MAX(CASE WHEN s.set_number = 3 THEN s.reps   END) AS Set3_reps,
          MAX(CASE WHEN s.set_number = 3 THEN s.erm    END) AS Set3_erm,
          MAX(CASE WHEN s.set_number = 4 THEN s.weight END) AS Set4_weight,
          MAX(CASE WHEN s.set_number = 4 THEN s.reps   END) AS Set4_reps,
          MAX(CASE WHEN s.set_number = 4 THEN s.erm    END) AS Set4_erm,
          MAX(CASE WHEN s.set_number = 5 THEN s.weight END) AS Set5_weight,
          MAX(CASE WHEN s.set_number = 5 THEN s.reps   END) AS Set5_reps,
          MAX(CASE WHEN s.set_number = 5 THEN s.erm    END) AS Set5_erm
        FROM workout_log w
        LEFT JOIN workout_set s ON s.workout_id = w.id
        LEFT JOIN exercise e ON e.name = w.exercise_name
        GROUP BY w.id, w.workout_date, w.exercise_name, e.image_filename
        ORDER BY w.workout_date DESC, w.id DESC
      `,
    });
    return result.result.resultRows || [];
  }

  async listByExerciseName(exerciseName: string): Promise<WorkoutTableRow[]> {
    const promiser = await getPromiser();
    const result = await promiser<WorkoutTableRow>('exec', {
      bind: [exerciseName],
      dbId: getDatabaseId(),
      rowMode: 'object',
      sql: `
        SELECT
          w.id,
          w.workout_date,
          w.exercise_name,
          e.image_filename AS exercise_image_filename,
          MAX(CASE WHEN s.set_number = 1 THEN s.weight END) AS Set1_weight,
          MAX(CASE WHEN s.set_number = 1 THEN s.reps   END) AS Set1_reps,
          MAX(CASE WHEN s.set_number = 1 THEN s.erm    END) AS Set1_erm,
          MAX(CASE WHEN s.set_number = 2 THEN s.weight END) AS Set2_weight,
          MAX(CASE WHEN s.set_number = 2 THEN s.reps   END) AS Set2_reps,
          MAX(CASE WHEN s.set_number = 2 THEN s.erm    END) AS Set2_erm,
          MAX(CASE WHEN s.set_number = 3 THEN s.weight END) AS Set3_weight,
          MAX(CASE WHEN s.set_number = 3 THEN s.reps   END) AS Set3_reps,
          MAX(CASE WHEN s.set_number = 3 THEN s.erm    END) AS Set3_erm,
          MAX(CASE WHEN s.set_number = 4 THEN s.weight END) AS Set4_weight,
          MAX(CASE WHEN s.set_number = 4 THEN s.reps   END) AS Set4_reps,
          MAX(CASE WHEN s.set_number = 4 THEN s.erm    END) AS Set4_erm,
          MAX(CASE WHEN s.set_number = 5 THEN s.weight END) AS Set5_weight,
          MAX(CASE WHEN s.set_number = 5 THEN s.reps   END) AS Set5_reps,
          MAX(CASE WHEN s.set_number = 5 THEN s.erm    END) AS Set5_erm
        FROM workout_log w
        LEFT JOIN workout_set s ON s.workout_id = w.id
        LEFT JOIN exercise e ON e.name = w.exercise_name
        WHERE w.exercise_name = ?
        GROUP BY w.id, w.workout_date, w.exercise_name, e.image_filename
        ORDER BY w.workout_date DESC, w.id DESC
      `,
    });
    return result.result.resultRows || [];
  }

  async update(
    id: number,
    workoutDate: string,
    exerciseName: string,
    sets: Array<{ erm: null | number; reps: number; weight: null | number }>,
  ): Promise<void> {
    await database
      .update(workoutLog)
      .set({ exerciseName, updatedAt: sql`CURRENT_TIMESTAMP`, workoutDate })
      .where(eq(workoutLog.id, id));

    await workoutSetRepository.deleteByWorkoutId(id);
    await workoutSetRepository.insertMany(id, sets);
  }
}

export const workoutLogRepository = new WorkoutLogRepository();
