import { getDatabaseId, initDriver } from './driver';
import { MigrationError, runMigrations } from './migrations';
import { validateSchema } from './validator';

export { MigrationError } from './migrations';

let initPromise: null | Promise<void> = null;

export const initDatabase = (): Promise<void> => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const promiser = await initDriver();
    const databaseId = getDatabaseId();
    await promiser('exec', {
      dbId: databaseId,
      sql: 'PRAGMA foreign_keys = ON',
    });
    try {
      await runMigrations(promiser, databaseId);
      await validateSchema(promiser, databaseId);
    } catch (error) {
      if (error instanceof MigrationError) {
        throw error;
      }

      throw new MigrationError('unknown', error);
    }
  })();

  return initPromise;
};
