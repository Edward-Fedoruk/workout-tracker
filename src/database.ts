import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

type CloseResult = {
  ok: boolean;
};

type ExecResult<Row = unknown> = {
  columnNames?: string[];
  resultRows: Row[];
};

type ExportResult = {
  byteArray: Uint8Array;
  filename: string;
  mimetype: string;
};

type OpenResult = {
  dbId: string;
  filename: string;
};

type Promiser = {
  (
    command: 'open',
    parameters: { filename: string },
  ): Promise<PromiserResponse<OpenResult>>;
  <Row = unknown>(
    command: 'exec',
    parameters: {
      bind?: readonly unknown[];
      dbId: string;
      rowMode?: 'array' | 'object';
      sql: string;
    },
  ): Promise<PromiserResponse<ExecResult<Row>>>;
  (
    command: 'export',
    parameters: { dbId: string },
  ): Promise<PromiserResponse<ExportResult>>;
  (
    command: 'close',
    parameters: { dbId: string },
  ): Promise<PromiserResponse<CloseResult>>;
};

type PromiserResponse<T> = {
  result: T;
};

let databasePromise: null | Promise<Promiser> = null;
let databaseId: null | string = null;

export type KVRow = {
  key: string;
  value: string;
};

const createPromiser = (): Promise<Promiser> => {
  return new Promise<Promiser>((resolve) => {
    const promiser = sqlite3Worker1Promiser({
      onready: () => {
        resolve(promiser as unknown as Promiser);
      },
    }) as unknown as Promiser;
  });
};

const open = async (promiser: Promiser): Promise<string> => {
  try {
    const opened = await promiser('open', {
      filename: 'file:app.sqlite3?vfs=opfs',
    });
    return opened.result.dbId;
  } catch {
    const opened = await promiser('open', { filename: ':memory:' });
    return opened.result.dbId;
  }
};

const createSchema = async (promiser: Promiser, id: string): Promise<void> => {
  await promiser('exec', {
    dbId: id,
    sql: 'PRAGMA foreign_keys = ON',
  });

  await promiser('exec', {
    dbId: id,
    sql: `
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `,
  });

  await promiser('exec', {
    dbId: id,
    sql: `
      CREATE TABLE IF NOT EXISTS workout_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_date DATE NOT NULL,
        exercise_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
  });

  await promiser('exec', {
    dbId: id,
    sql: `
      CREATE TABLE IF NOT EXISTS workout_set (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workout_log(id) ON DELETE CASCADE,
        set_number INTEGER NOT NULL CHECK (set_number BETWEEN 1 AND 5),
        weight REAL NOT NULL CHECK (weight > 0),
        reps INTEGER NOT NULL CHECK (reps > 0),
        UNIQUE(workout_id, set_number)
      )
    `,
  });
};

const requireDatabaseId = (): string => {
  if (databaseId === null) {
    throw new Error('Database not initialized: call initDatabase() first');
  }

  return databaseId;
};

export const initDatabase = (): Promise<Promiser> => {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = (async () => {
    const promiser = await createPromiser();
    const id = await open(promiser);
    databaseId = id;
    await createSchema(promiser, id);
    return promiser;
  })();
  return databasePromise;
};

export const getKV = async (key: string): Promise<null | string> => {
  const promiser = await initDatabase();
  const result = await promiser<{ value: string }>('exec', {
    bind: [key],
    dbId: requireDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT value FROM kv WHERE key = ?',
  });
  const row = result.result.resultRows[0];
  return row ? row.value : null;
};

export const listKV = async (): Promise<KVRow[]> => {
  const promiser = await initDatabase();
  const result = await promiser<KVRow>('exec', {
    dbId: requireDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT key, value FROM kv ORDER BY key ASC',
  });
  return result.result.resultRows;
};

export const setKV = async (key: string, value: string): Promise<void> => {
  const promiser = await initDatabase();
  await promiser('exec', {
    bind: [key, value],
    dbId: requireDatabaseId(),
    sql: 'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  });
};

export type WorkoutSet = {
  id: number;
  reps: number;
  set_number: number;
  weight: number;
  workout_id: number;
};

export type WorkoutTableRow = {
  exercise_name: string;
  id: number;
  Set1_reps: null | number;
  Set1_weight: null | number;
  Set2_reps: null | number;
  Set2_weight: null | number;
  Set3_reps: null | number;
  Set3_weight: null | number;
  Set4_reps: null | number;
  Set4_weight: null | number;
  Set5_reps: null | number;
  Set5_weight: null | number;
  workout_date: string;
};

export type WorkoutWithSets = {
  created_at: string;
  exercise_name: string;
  id: number;
  sets: WorkoutSet[];
  updated_at: string;
  workout_date: string;
};

export const createWorkout = async (
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ reps: number; weight: number }>,
): Promise<number> => {
  const promiser = await initDatabase();

  await promiser('exec', {
    bind: [workoutDate, exerciseName],
    dbId: requireDatabaseId(),
    sql: 'INSERT INTO workout_log (workout_date, exercise_name) VALUES (?, ?)',
  });

  const idResult = await promiser<{ last_id: number }>('exec', {
    dbId: requireDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT last_insert_rowid() AS last_id',
  });

  const row = idResult.result.resultRows[0];
  if (row === undefined) {
    throw new Error('INSERT failed: no rowid returned');
  }

  const workoutId = row.last_id;

  await Promise.all(
    sets.map((set, index) =>
      promiser('exec', {
        bind: [workoutId, index + 1, set.weight, set.reps],
        dbId: requireDatabaseId(),
        sql: 'INSERT INTO workout_set (workout_id, set_number, weight, reps) VALUES (?, ?, ?, ?)',
      }),
    ),
  );

  return workoutId;
};

export const listWorkouts = async (): Promise<WorkoutTableRow[]> => {
  const promiser = await initDatabase();
  const result = await promiser<WorkoutTableRow>('exec', {
    dbId: requireDatabaseId(),
    rowMode: 'object',
    sql: `
      SELECT
        w.id,
        w.workout_date,
        w.exercise_name,
        MAX(CASE WHEN s.set_number = 1 THEN s.weight END) AS Set1_weight,
        MAX(CASE WHEN s.set_number = 1 THEN s.reps END) AS Set1_reps,
        MAX(CASE WHEN s.set_number = 2 THEN s.weight END) AS Set2_weight,
        MAX(CASE WHEN s.set_number = 2 THEN s.reps END) AS Set2_reps,
        MAX(CASE WHEN s.set_number = 3 THEN s.weight END) AS Set3_weight,
        MAX(CASE WHEN s.set_number = 3 THEN s.reps END) AS Set3_reps,
        MAX(CASE WHEN s.set_number = 4 THEN s.weight END) AS Set4_weight,
        MAX(CASE WHEN s.set_number = 4 THEN s.reps END) AS Set4_reps,
        MAX(CASE WHEN s.set_number = 5 THEN s.weight END) AS Set5_weight,
        MAX(CASE WHEN s.set_number = 5 THEN s.reps END) AS Set5_reps
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
  const promiser = await initDatabase();

  const workoutResult = await promiser<{
    created_at: string;
    exercise_name: string;
    id: number;
    updated_at: string;
    workout_date: string;
  }>('exec', {
    bind: [id],
    dbId: requireDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT id, workout_date, exercise_name, created_at, updated_at FROM workout_log WHERE id = ?',
  });

  const workout = workoutResult.result.resultRows[0];
  if (!workout) {
    return null;
  }

  const setsResult = await promiser<WorkoutSet>('exec', {
    bind: [id],
    dbId: requireDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT id, workout_id, set_number, weight, reps FROM workout_set WHERE workout_id = ? ORDER BY set_number ASC',
  });

  return {
    ...workout,
    sets: setsResult.result.resultRows || [],
  };
};

export const updateWorkout = async (
  id: number,
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ reps: number; weight: number }>,
): Promise<void> => {
  const promiser = await initDatabase();

  await promiser('exec', {
    bind: [workoutDate, exerciseName, id],
    dbId: requireDatabaseId(),
    sql: 'UPDATE workout_log SET workout_date = ?, exercise_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  });

  await promiser('exec', {
    bind: [id],
    dbId: requireDatabaseId(),
    sql: 'DELETE FROM workout_set WHERE workout_id = ?',
  });

  await Promise.all(
    sets.map((set, index) =>
      promiser('exec', {
        bind: [id, index + 1, set.weight, set.reps],
        dbId: requireDatabaseId(),
        sql: 'INSERT INTO workout_set (workout_id, set_number, weight, reps) VALUES (?, ?, ?, ?)',
      }),
    ),
  );
};

export const deleteWorkout = async (id: number): Promise<void> => {
  const promiser = await initDatabase();

  await promiser('exec', {
    bind: [id],
    dbId: requireDatabaseId(),
    sql: 'DELETE FROM workout_set WHERE workout_id = ?',
  });

  await promiser('exec', {
    bind: [id],
    dbId: requireDatabaseId(),
    sql: 'DELETE FROM workout_log WHERE id = ?',
  });
};

export const exportDatabaseBytes = async (): Promise<Uint8Array> => {
  const promiser = await initDatabase();
  const result = await promiser('export', {
    dbId: requireDatabaseId(),
  });
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

  try {
    await (
      await initDatabase()
    )('close', {
      dbId: requireDatabaseId(),
    });
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
