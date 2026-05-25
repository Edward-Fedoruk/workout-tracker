import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

export type Promiser = {
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

type PromiserResponse<T> = {
  result: T;
};

let databasePromise: null | Promise<Promiser> = null;
let databaseId: null | string = null;

export const createPromiser = (): Promise<Promiser> => {
  return new Promise<Promiser>((resolve) => {
    const promiser = sqlite3Worker1Promiser({
      onready: () => {
        resolve(promiser as unknown as Promiser);
      },
    }) as unknown as Promiser;
  });
};

export const open = async (promiser: Promiser): Promise<string> => {
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

export const requireDatabaseId = (): string => {
  if (databaseId === null) {
    throw new Error('Database not initialized: call initDatabase() first');
  }

  return databaseId;
};

export const getDatabaseId = (): string => requireDatabaseId();

export const getPromiser = async (): Promise<Promiser> => {
  if (databasePromise === null) {
    throw new Error('Database not initialized: call initDatabase() first');
  }

  return databasePromise;
};

export const initDriver = (): Promise<Promiser> => {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = (async () => {
    const promiser = await createPromiser();
    const id = await open(promiser);
    databaseId = id;
    return promiser;
  })();

  return databasePromise;
};
