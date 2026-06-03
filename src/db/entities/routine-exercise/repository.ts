import { routineExercise } from './schema';
import { type LastExerciseSets } from './types';
import { getDatabaseId, getPromiser } from '@/db/driver';
import { database } from '@/db/orm';
import { eq } from 'drizzle-orm';

class RoutineExerciseRepository {
  async add(
    routineId: number,
    exerciseName: string,
    suggestedSets: number,
    minReps: number,
    maxReps: number,
  ): Promise<number> {
    const promiser = await getPromiser();
    const maxResult = await promiser<{ max_pos: null | number }>('exec', {
      bind: [routineId],
      dbId: getDatabaseId(),
      rowMode: 'object',
      sql: 'SELECT MAX(position) AS max_pos FROM routine_exercise WHERE routine_id = ?',
    });
    const maxPos = maxResult.result.resultRows[0]?.max_pos ?? 0;
    const position = maxPos + 1;

    const inserted = await database
      .insert(routineExercise)
      .values({
        exerciseName,
        maxReps,
        minReps,
        position,
        routineId,
        suggestedSets,
      })
      .returning({ id: routineExercise.id });

    const id = inserted[0]?.id;
    if (id === undefined) {
      throw new Error('INSERT routine_exercise failed: no row returned');
    }

    return id;
  }

  async delete(id: number, routineId: number): Promise<void> {
    const promiser = await getPromiser();
    const databaseId = getDatabaseId();

    await promiser('exec', { dbId: databaseId, sql: 'BEGIN' });
    try {
      await promiser('exec', {
        bind: [id],
        dbId: databaseId,
        sql: 'DELETE FROM routine_exercise WHERE id = ?',
      });
      await promiser('exec', {
        bind: [routineId, routineId],
        dbId: databaseId,
        sql: `
          UPDATE routine_exercise
          SET position = (
            SELECT COUNT(*) FROM routine_exercise re2
            WHERE re2.routine_id = ? AND re2.position <= routine_exercise.position
          )
          WHERE routine_id = ?
        `,
      });
      await promiser('exec', { dbId: databaseId, sql: 'COMMIT' });
    } catch (error) {
      await promiser('exec', { dbId: databaseId, sql: 'ROLLBACK' }).catch(
        () => undefined,
      );
      throw error;
    }
  }

  async getLastSets(
    exerciseName: string,
    setCount: number,
  ): Promise<LastExerciseSets> {
    const promiser = await getPromiser();
    const result = await promiser<{
      reps: number;
      set_number: number;
      weight: null | number;
    }>('exec', {
      bind: [exerciseName, exerciseName, setCount],
      dbId: getDatabaseId(),
      rowMode: 'object',
      sql: `
        SELECT s.set_number, s.weight, s.reps
        FROM workout_log w
        JOIN workout_set s ON s.workout_id = w.id
        WHERE LOWER(w.exercise_name) = LOWER(?)
          AND w.id = (
            SELECT id FROM workout_log
            WHERE LOWER(exercise_name) = LOWER(?)
            ORDER BY workout_date DESC, id DESC
            LIMIT 1
          )
        ORDER BY s.set_number ASC
        LIMIT ?
      `,
    });

    return (result.result.resultRows || []).map((row) => ({
      reps: row.reps,
      setNumber: row.set_number,
      weight: row.weight,
    }));
  }

  async move(
    id: number,
    routineId: number,
    direction: 'down' | 'up',
  ): Promise<void> {
    const promiser = await getPromiser();
    const databaseId = getDatabaseId();

    const posResult = await promiser<{ position: number }>('exec', {
      bind: [id],
      dbId: databaseId,
      rowMode: 'object',
      sql: 'SELECT position FROM routine_exercise WHERE id = ?',
    });
    const currentPos = posResult.result.resultRows[0]?.position;
    if (currentPos === undefined) {
      return;
    }

    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;

    const neighbourResult = await promiser<{ id: number }>('exec', {
      bind: [routineId, targetPos],
      dbId: databaseId,
      rowMode: 'object',
      sql: 'SELECT id FROM routine_exercise WHERE routine_id = ? AND position = ?',
    });
    const neighbourId = neighbourResult.result.resultRows[0]?.id;
    if (neighbourId === undefined) {
      return;
    }

    await promiser('exec', { dbId: databaseId, sql: 'BEGIN' });
    try {
      await promiser('exec', {
        bind: [targetPos, id],
        dbId: databaseId,
        sql: 'UPDATE routine_exercise SET position = ? WHERE id = ?',
      });
      await promiser('exec', {
        bind: [currentPos, neighbourId],
        dbId: databaseId,
        sql: 'UPDATE routine_exercise SET position = ? WHERE id = ?',
      });
      await promiser('exec', { dbId: databaseId, sql: 'COMMIT' });
    } catch (error) {
      await promiser('exec', { dbId: databaseId, sql: 'ROLLBACK' }).catch(
        () => undefined,
      );
      throw error;
    }
  }

  async update(
    id: number,
    exerciseName: string,
    suggestedSets: number,
    minReps: number,
    maxReps: number,
  ): Promise<void> {
    await database
      .update(routineExercise)
      .set({ exerciseName, maxReps, minReps, suggestedSets })
      .where(eq(routineExercise.id, id));
  }
}

export const routineExerciseRepository = new RoutineExerciseRepository();
