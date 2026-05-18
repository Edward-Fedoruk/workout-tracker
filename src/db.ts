import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

interface OpenResult {
  dbId: string;
  filename: string;
}

interface ExecResult<Row = unknown> {
  resultRows: Row[];
  columnNames?: string[];
}

interface PromiserResponse<T> {
  result: T;
}

interface Promiser {
  (command: 'open', params: { filename: string }): Promise<PromiserResponse<OpenResult>>;
  <Row = unknown>(
    command: 'exec',
    params: {
      sql: string;
      bind?: readonly unknown[];
      rowMode?: 'object' | 'array';
      dbId: string;
    },
  ): Promise<PromiserResponse<ExecResult<Row>>>;
}

let dbPromise: Promise<Promiser> | null = null;
let dbId: string | null = null;

function createPromiser(): Promise<Promiser> {
  return new Promise<Promiser>((resolve) => {
    const promiser = sqlite3Worker1Promiser({
      onready: () => { resolve(promiser as unknown as Promiser); },
    }) as unknown as Promiser;
  });
}

async function open(promiser: Promiser): Promise<string> {
  try {
    const opened = await promiser('open', { filename: 'file:app.sqlite3?vfs=opfs' });
    console.log('OPFS database opened:', opened.result.filename);
    return opened.result.dbId;
  } catch (opfsError) {
    console.warn('OPFS unavailable, falling back to in-memory database:', opfsError);
    const opened = await promiser('open', { filename: ':memory:' });
    return opened.result.dbId;
  }
}

async function createSchema(promiser: Promiser, id: string): Promise<void> {
  await promiser('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `,
    dbId: id,
  });
}

export function initDb(): Promise<Promiser> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const promiser = await createPromiser();
    const id = await open(promiser);
    dbId = id;
    await createSchema(promiser, id);
    console.log('Database initialized');
    return promiser;
  })();
  return dbPromise;
}

function requireDbId(): string {
  if (dbId === null) throw new Error('Database not initialized: call initDb() first');
  return dbId;
}

export async function setKV(key: string, value: string): Promise<void> {
  const promiser = await initDb();
  await promiser('exec', {
    sql: 'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    bind: [key, value],
    dbId: requireDbId(),
  });
}

export async function getKV(key: string): Promise<string | null> {
  const promiser = await initDb();
  const result = await promiser<{ value: string }>('exec', {
    sql: 'SELECT value FROM kv WHERE key = ?',
    bind: [key],
    rowMode: 'object',
    dbId: requireDbId(),
  });
  const row = result.result.resultRows[0];
  return row ? row.value : null;
}

export interface KVRow {
  key: string;
  value: string;
}

export async function listKV(): Promise<KVRow[]> {
  const promiser = await initDb();
  const result = await promiser<KVRow>('exec', {
    sql: 'SELECT key, value FROM kv ORDER BY key ASC',
    rowMode: 'object',
    dbId: requireDbId(),
  });
  return result.result.resultRows;
}
