import { getDatabaseId, getPromiser } from './driver';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

export const database = drizzle(
  async (sql, parameters, method) => {
    const promiser = await getPromiser();
    const databaseId = getDatabaseId();

    const result = await promiser('exec', {
      bind: parameters as unknown[],
      dbId: databaseId,
      rowMode: 'object',
      sql,
    });

    const rows = result.result.resultRows ?? [];

    if (method === 'run') {
      return { rows: [] };
    }

    return { rows };
  },
  { schema },
);
