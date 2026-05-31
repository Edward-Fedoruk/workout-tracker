import { getDatabaseId, getPromiser } from './db/driver';
import { initDatabase } from './db/initDatabase';
import { database } from './db/orm';
import { workoutLog, workoutSet } from './db/schema';
import { eq, sql } from 'drizzle-orm';

export {
  createExercise,
  createMuscleGroup,
  deleteExercise,
  deleteMuscleGroup,
  listExercises,
  listMuscleGroups,
  updateExercise,
  updateMuscleGroup,
} from './db/exerciseHelpers';
export type {
  Exercise,
  ExerciseClassification,
  MuscleGroup,
} from './db/exerciseHelpers';
export { MigrationError } from './db/initDatabase';
export { initDatabase } from './db/initDatabase';
export {
  addRoutineExercise,
  createRoutine,
  deleteRoutine,
  deleteRoutineExercise,
  getLastExerciseSets,
  getRoutineById,
  listRoutines,
  moveRoutineExercise,
  updateRoutine,
  updateRoutineExercise,
} from './db/routineHelpers';
export type {
  LastExerciseSets,
  Routine,
  RoutineExercise,
  RoutineWithExercises,
} from './db/routineHelpers';
export { getBodyWeight, setBodyWeight } from './db/settingsHelpers';

export type WorkoutLog = typeof workoutLog.$inferSelect;
export type WorkoutSet = typeof workoutSet.$inferSelect;

export type WorkoutTableRow = {
  exercise_name: string;
  id: number;
  Set1_erm: null | number;
  Set1_reps: null | number;
  Set1_weight: null | number;
  Set2_erm: null | number;
  Set2_reps: null | number;
  Set2_weight: null | number;
  Set3_erm: null | number;
  Set3_reps: null | number;
  Set3_weight: null | number;
  Set4_erm: null | number;
  Set4_reps: null | number;
  Set4_weight: null | number;
  Set5_erm: null | number;
  Set5_reps: null | number;
  Set5_weight: null | number;
  workout_date: string;
};

export type WorkoutWithSets = WorkoutLog & { sets: WorkoutSet[] };

export const createWorkout = async (
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ erm: null | number; reps: number; weight: null | number }>,
): Promise<number> => {
  await initDatabase();

  const inserted = await database
    .insert(workoutLog)
    .values({ exerciseName, workoutDate })
    .returning({ id: workoutLog.id });

  const id = inserted[0]?.id;
  if (id === undefined) {
    const promiser = await getPromiser();
    const idResult = await promiser<{ last_id: number }>('exec', {
      dbId: getDatabaseId(),
      rowMode: 'object',
      sql: 'SELECT last_insert_rowid() AS last_id',
    });
    const row = idResult.result.resultRows[0];
    if (row === undefined) {
      throw new Error('INSERT failed: no rowid returned');
    }

    return row.last_id;
  }

  await database.insert(workoutSet).values(
    sets.map((set, index) => ({
      erm: set.erm,
      reps: set.reps,
      setNumber: index + 1,
      weight: set.weight,
      workoutId: id,
    })),
  );

  return id;
};

// listWorkouts uses a MAX(CASE...) pivot query not expressible in Drizzle's query
// builder. Raw SQL is the documented exception — see contracts/database.ts.md FR-004.
export const listWorkouts = async (): Promise<WorkoutTableRow[]> => {
  await initDatabase();
  const promiser = await getPromiser();
  const result = await promiser<WorkoutTableRow>('exec', {
    dbId: getDatabaseId(),
    rowMode: 'object',
    sql: `
      SELECT
        w.id,
        w.workout_date,
        w.exercise_name,
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
      GROUP BY w.id, w.workout_date, w.exercise_name
      ORDER BY w.workout_date DESC, w.id DESC
    `,
  });
  return result.result.resultRows || [];
};

export const getWorkoutById = async (
  id: number,
): Promise<null | WorkoutWithSets> => {
  await initDatabase();

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
};

export const updateWorkout = async (
  id: number,
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ erm: null | number; reps: number; weight: null | number }>,
): Promise<void> => {
  await initDatabase();

  await database
    .update(workoutLog)
    .set({ exerciseName, updatedAt: sql`CURRENT_TIMESTAMP`, workoutDate })
    .where(eq(workoutLog.id, id));

  await database.delete(workoutSet).where(eq(workoutSet.workoutId, id));

  if (sets.length > 0) {
    await database.insert(workoutSet).values(
      sets.map((set, index) => ({
        erm: set.erm,
        reps: set.reps,
        setNumber: index + 1,
        weight: set.weight,
        workoutId: id,
      })),
    );
  }
};

export const deleteWorkout = async (id: number): Promise<void> => {
  await initDatabase();

  await database.delete(workoutSet).where(eq(workoutSet.workoutId, id));
  await database.delete(workoutLog).where(eq(workoutLog.id, id));
};

export const exportDatabaseBytes = async (): Promise<Uint8Array> => {
  await initDatabase();
  const promiser = await getPromiser();
  const result = await promiser('export', { dbId: getDatabaseId() });
  const bytes = result.result.byteArray;
  if (bytes instanceof Uint8Array) {
    return bytes;
  }

  return new Uint8Array(bytes as ArrayBuffer);
};

export const replaceDatabaseAndReload = async (
  bytes: Uint8Array,
): Promise<never> => {
  await initDatabase();

  const headerBytes = bytes.slice(0, 16);
  const headerText = new TextDecoder('latin1').decode(headerBytes);

  if (!headerText.includes('SQLite format 3')) {
    throw new Error('Selected file is not a SQLite database.');
  }

  const promiser = await getPromiser();

  try {
    await promiser('close', { dbId: getDatabaseId() });
  } catch {
    // Log but don't abort — reload will reset the worker
  }

  if (navigator.storage) {
    const root = await navigator.storage.getDirectory();
    for (const name of [
      'app.sqlite3',
      'app.sqlite3-journal',
      'app.sqlite3-wal',
      'app.sqlite3-shm',
    ]) {
      await root.removeEntry(name).catch(() => undefined);
    }

    const fileHandle = await root.getFileHandle('app.sqlite3', {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
  }

  location.reload();
  throw new Error('Reload failed');
};

// eslint-disable-next-line canonical/id-match, unicorn/prevent-abbreviations, @typescript-eslint/naming-convention -- contract specifies __devRollback as the exported name
export const __devRollback = async (migrationName: string): Promise<void> => {
  if (!import.meta.env.DEV) {
    return;
  }

  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  const downFiles = import.meta.glob('../../drizzle/*_down.sql', {
    eager: true,
    import: 'default',
    query: '?raw',
  }) as Record<string, string>;

  const base = migrationName.replace(/\.sql$/u, '');
  const downKey = Object.keys(downFiles).find((key) =>
    key.includes(`${base}_down.sql`),
  );
  const downSql = downKey ? downFiles[downKey] : null;

  if (downSql) {
    const statements = downSql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await promiser('exec', { dbId: databaseId, sql: statement });
    }
  }

  await promiser('exec', {
    bind: [migrationName],
    dbId: databaseId,
    sql: 'DELETE FROM __drizzle_migrations WHERE name = ?',
  });
};
