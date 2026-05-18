import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

type ExecResult<Row = unknown> = {
  columnNames?: string[];
  resultRows: Row[];
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
    sql: `
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
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
