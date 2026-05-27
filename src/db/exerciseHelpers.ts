import { getDatabaseId, getPromiser } from './driver';
import { initDatabase } from './initDatabase';

export type Exercise = {
  createdAt: string;
  id: number;
  muscleGroups: MuscleGroup[];
  name: string;
};

export type MuscleGroup = {
  id: number;
  name: string;
};

type ExerciseMuscleGroupRow = {
  exercise_id: number;
  muscle_group_id: number;
  muscle_group_name: string;
};

type ExerciseRow = {
  created_at: string;
  id: number;
  name: string;
};

type MuscleGroupRow = {
  id: number;
  name: string;
};

export const listExercises = async (): Promise<Exercise[]> => {
  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  const exercisesResult = await promiser<ExerciseRow>('exec', {
    dbId: databaseId,
    rowMode: 'object',
    sql: 'SELECT id, name, created_at FROM exercise ORDER BY name COLLATE NOCASE ASC',
  });

  const joinResult = await promiser<ExerciseMuscleGroupRow>('exec', {
    dbId: databaseId,
    rowMode: 'object',
    sql: `
      SELECT emg.exercise_id, mg.id AS muscle_group_id, mg.name AS muscle_group_name
      FROM exercise_muscle_group emg
      JOIN muscle_group mg ON mg.id = emg.muscle_group_id
      ORDER BY mg.name COLLATE NOCASE ASC
    `,
  });

  const groupsByExerciseId = new Map<number, MuscleGroup[]>();
  for (const row of joinResult.result.resultRows || []) {
    const list = groupsByExerciseId.get(row.exercise_id) ?? [];
    list.push({ id: row.muscle_group_id, name: row.muscle_group_name });
    groupsByExerciseId.set(row.exercise_id, list);
  }

  return (exercisesResult.result.resultRows || []).map((row) => ({
    createdAt: row.created_at,
    id: row.id,
    muscleGroups: groupsByExerciseId.get(row.id) ?? [],
    name: row.name,
  }));
};

const insertMuscleGroupAssignments = async (
  promiser: Awaited<ReturnType<typeof getPromiser>>,
  databaseId: string,
  exerciseId: number,
  muscleGroupIds: number[],
): Promise<void> => {
  for (const muscleGroupId of muscleGroupIds) {
    await promiser('exec', {
      bind: [exerciseId, muscleGroupId],
      dbId: databaseId,
      sql: 'INSERT INTO exercise_muscle_group (exercise_id, muscle_group_id) VALUES (?, ?)',
    });
  }
};

export const createExercise = async (
  name: string,
  muscleGroupIds: number[],
): Promise<number> => {
  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  await promiser('exec', { dbId: databaseId, sql: 'BEGIN' });
  try {
    await promiser('exec', {
      bind: [name],
      dbId: databaseId,
      sql: 'INSERT INTO exercise (name) VALUES (?)',
    });

    const idResult = await promiser<{ last_id: number }>('exec', {
      dbId: databaseId,
      rowMode: 'object',
      sql: 'SELECT last_insert_rowid() AS last_id',
    });
    const id = idResult.result.resultRows[0]?.last_id;
    if (id === undefined) {
      throw new Error('INSERT exercise failed: no rowid returned');
    }

    await insertMuscleGroupAssignments(
      promiser,
      databaseId,
      id,
      muscleGroupIds,
    );
    await promiser('exec', { dbId: databaseId, sql: 'COMMIT' });
    return id;
  } catch (error) {
    await promiser('exec', { dbId: databaseId, sql: 'ROLLBACK' }).catch(
      () => undefined,
    );
    throw error;
  }
};

export const updateExercise = async (
  id: number,
  name: string,
  muscleGroupIds: number[],
): Promise<void> => {
  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  const oldResult = await promiser<{ name: string }>('exec', {
    bind: [id],
    dbId: databaseId,
    rowMode: 'object',
    sql: 'SELECT name FROM exercise WHERE id = ?',
  });
  const oldName = oldResult.result.resultRows[0]?.name;
  if (oldName === undefined) {
    throw new Error(`Exercise ${id} not found`);
  }

  await promiser('exec', { dbId: databaseId, sql: 'BEGIN' });
  try {
    await promiser('exec', {
      bind: [name, id],
      dbId: databaseId,
      sql: 'UPDATE exercise SET name = ? WHERE id = ?',
    });

    if (oldName !== name) {
      await promiser('exec', {
        bind: [name, oldName],
        dbId: databaseId,
        sql: 'UPDATE workout_log SET exercise_name = ? WHERE exercise_name = ?',
      });
      await promiser('exec', {
        bind: [name, oldName],
        dbId: databaseId,
        sql: 'UPDATE routine_exercise SET exercise_name = ? WHERE exercise_name = ?',
      });
    }

    await promiser('exec', {
      bind: [id],
      dbId: databaseId,
      sql: 'DELETE FROM exercise_muscle_group WHERE exercise_id = ?',
    });

    await insertMuscleGroupAssignments(
      promiser,
      databaseId,
      id,
      muscleGroupIds,
    );
    await promiser('exec', { dbId: databaseId, sql: 'COMMIT' });
  } catch (error) {
    await promiser('exec', { dbId: databaseId, sql: 'ROLLBACK' }).catch(
      () => undefined,
    );
    throw error;
  }
};

export const deleteExercise = async (id: number): Promise<void> => {
  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  const nameResult = await promiser<{ name: string }>('exec', {
    bind: [id],
    dbId: databaseId,
    rowMode: 'object',
    sql: 'SELECT name FROM exercise WHERE id = ?',
  });
  const name = nameResult.result.resultRows[0]?.name;
  if (name === undefined) {
    return;
  }

  await promiser('exec', { dbId: databaseId, sql: 'BEGIN' });
  try {
    await promiser('exec', {
      bind: [name],
      dbId: databaseId,
      sql: 'DELETE FROM routine_exercise WHERE exercise_name = ?',
    });
    await promiser('exec', {
      bind: [id],
      dbId: databaseId,
      sql: 'DELETE FROM exercise WHERE id = ?',
    });
    await promiser('exec', { dbId: databaseId, sql: 'COMMIT' });
  } catch (error) {
    await promiser('exec', { dbId: databaseId, sql: 'ROLLBACK' }).catch(
      () => undefined,
    );
    throw error;
  }
};

export const listMuscleGroups = async (): Promise<MuscleGroup[]> => {
  await initDatabase();
  const promiser = await getPromiser();
  const result = await promiser<MuscleGroupRow>('exec', {
    dbId: getDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT id, name FROM muscle_group ORDER BY name COLLATE NOCASE ASC',
  });
  return (result.result.resultRows || []).map((row) => ({
    id: row.id,
    name: row.name,
  }));
};

export const createMuscleGroup = async (name: string): Promise<number> => {
  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  await promiser('exec', {
    bind: [name],
    dbId: databaseId,
    sql: 'INSERT INTO muscle_group (name) VALUES (?)',
  });

  const idResult = await promiser<{ last_id: number }>('exec', {
    dbId: databaseId,
    rowMode: 'object',
    sql: 'SELECT last_insert_rowid() AS last_id',
  });
  const id = idResult.result.resultRows[0]?.last_id;
  if (id === undefined) {
    throw new Error('INSERT muscle_group failed: no rowid returned');
  }

  return id;
};

export const updateMuscleGroup = async (
  id: number,
  name: string,
): Promise<void> => {
  await initDatabase();
  const promiser = await getPromiser();
  await promiser('exec', {
    bind: [name, id],
    dbId: getDatabaseId(),
    sql: 'UPDATE muscle_group SET name = ? WHERE id = ?',
  });
};

export const deleteMuscleGroup = async (id: number): Promise<void> => {
  await initDatabase();
  const promiser = await getPromiser();
  await promiser('exec', {
    bind: [id],
    dbId: getDatabaseId(),
    sql: 'DELETE FROM muscle_group WHERE id = ?',
  });
};
