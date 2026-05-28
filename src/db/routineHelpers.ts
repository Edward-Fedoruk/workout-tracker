import { getDatabaseId, getPromiser } from './driver';
import { initDatabase } from './initDatabase';
import { database } from './orm';
import { routine, routineExercise } from './schema';
import { eq, sql } from 'drizzle-orm';

export type LastExerciseSets = Array<{
  reps: number;
  setNumber: number;
  weight: number;
}>;
export type Routine = typeof routine.$inferSelect;
export type RoutineExercise = typeof routineExercise.$inferSelect;

export type RoutineWithExercises = Routine & { exercises: RoutineExercise[] };

export const listRoutines = async (): Promise<RoutineWithExercises[]> => {
  await initDatabase();

  const routines = await database
    .select()
    .from(routine)
    .orderBy(routine.createdAt);

  const exercises = await database
    .select()
    .from(routineExercise)
    .orderBy(routineExercise.routineId, routineExercise.position);

  const exercisesByRoutineId = new Map<number, RoutineExercise[]>();
  for (const exercise of exercises) {
    const list = exercisesByRoutineId.get(exercise.routineId) ?? [];
    list.push(exercise);
    exercisesByRoutineId.set(exercise.routineId, list);
  }

  return routines.map((routineRow) => ({
    ...routineRow,
    exercises: exercisesByRoutineId.get(routineRow.id) ?? [],
  }));
};

export const getRoutineById = async (
  id: number,
): Promise<null | RoutineWithExercises> => {
  await initDatabase();

  const routines = await database
    .select()
    .from(routine)
    .where(eq(routine.id, id));

  const routineRow = routines[0];
  if (!routineRow) {
    return null;
  }

  const exercises = await database
    .select()
    .from(routineExercise)
    .where(eq(routineExercise.routineId, id))
    .orderBy(routineExercise.position);

  return { ...routineRow, exercises };
};

export const createRoutine = async (name: string): Promise<number> => {
  await initDatabase();

  const inserted = await database
    .insert(routine)
    .values({ name })
    .returning({ id: routine.id });

  const id = inserted[0]?.id;
  if (id !== undefined) {
    return id;
  }

  const promiser = await getPromiser();
  const result = await promiser<{ last_id: number }>('exec', {
    dbId: getDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT last_insert_rowid() AS last_id',
  });
  const row = result.result.resultRows[0];
  if (!row) {
    throw new Error('INSERT routine failed: no rowid returned');
  }

  return row.last_id;
};

export const updateRoutine = async (
  id: number,
  name: string,
): Promise<void> => {
  await initDatabase();

  await database
    .update(routine)
    .set({ name, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(routine.id, id));
};

export const deleteRoutine = async (id: number): Promise<void> => {
  await initDatabase();
  await database.delete(routine).where(eq(routine.id, id));
};

export const addRoutineExercise = async (
  routineId: number,
  exerciseName: string,
  suggestedSets: number,
  minReps: number,
  maxReps: number,
): Promise<number> => {
  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  const maxResult = await promiser<{ max_pos: null | number }>('exec', {
    bind: [routineId],
    dbId: databaseId,
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
  if (id !== undefined) {
    return id;
  }

  const idResult = await promiser<{ last_id: number }>('exec', {
    dbId: databaseId,
    rowMode: 'object',
    sql: 'SELECT last_insert_rowid() AS last_id',
  });
  const row = idResult.result.resultRows[0];
  if (!row) {
    throw new Error('INSERT routine_exercise failed: no rowid returned');
  }

  return row.last_id;
};

export const updateRoutineExercise = async (
  id: number,
  exerciseName: string,
  suggestedSets: number,
  minReps: number,
  maxReps: number,
): Promise<void> => {
  await initDatabase();

  await database
    .update(routineExercise)
    .set({ exerciseName, maxReps, minReps, suggestedSets })
    .where(eq(routineExercise.id, id));
};

export const deleteRoutineExercise = async (
  id: number,
  routineId: number,
): Promise<void> => {
  await initDatabase();
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
};

export const moveRoutineExercise = async (
  id: number,
  routineId: number,
  direction: 'down' | 'up',
): Promise<void> => {
  await initDatabase();
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
};

export const getLastExerciseSets = async (
  exerciseName: string,
  setCount: number,
): Promise<LastExerciseSets> => {
  await initDatabase();
  const promiser = await getPromiser();
  const result = await promiser<{
    reps: number;
    set_number: number;
    weight: number;
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
};
