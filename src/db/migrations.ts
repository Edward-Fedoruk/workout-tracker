import { type Promiser } from './driver';

export class MigrationError extends Error {
  migrationName: string;

  constructor(migrationName: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`Migration failed: ${migrationName} — ${message}`);
    this.name = 'MigrationError';
    this.migrationName = migrationName;
    (this as unknown as Record<string, unknown>)['cause'] = cause;
  }
}

const sqlFiles = import.meta.glob('../../drizzle/*.sql', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const getMigrationFiles = (): Array<{ name: string; sql: string }> => {
  const files = Object.entries(sqlFiles).map(([filePath, sql]) => ({
    name: filePath.split('/').slice(-1)[0] ?? filePath,
    sql,
  }));
  // eslint-disable-next-line unicorn/no-array-sort -- toSorted() not available in ES2020 lib
  return files.sort((a, b) => a.name.localeCompare(b.name));
};

export const runMigrations = async (
  promiser: Promiser,
  databaseId: string,
): Promise<void> => {
  await promiser('exec', {
    dbId: databaseId,
    sql: `
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
  });

  const appliedResult = await promiser<{ name: string }>('exec', {
    dbId: databaseId,
    rowMode: 'object',
    sql: 'SELECT name FROM __drizzle_migrations ORDER BY name ASC',
  });

  const appliedNames = new Set(
    (appliedResult.result.resultRows || []).map((row) => row.name),
  );

  const migrationFiles = getMigrationFiles();
  const fileNames = new Set(migrationFiles.map((file) => file.name));

  for (const appliedName of appliedNames) {
    if (!fileNames.has(appliedName)) {
      throw new MigrationError(
        appliedName,
        new Error(
          `Migration file "${appliedName}" was applied but is no longer present on disk`,
        ),
      );
    }
  }

  const pending = migrationFiles.filter((file) => !appliedNames.has(file.name));

  for (const migration of pending) {
    // eslint-disable-next-line no-console -- migration progress must be visible in DevTools for debugging
    console.log(
      `[migrations] Applying ${migration.name} at ${new Date().toISOString()}`,
    );

    const statements = migration.sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    try {
      await promiser('exec', { dbId: databaseId, sql: 'BEGIN' });

      for (const statement of statements) {
        await promiser('exec', { dbId: databaseId, sql: statement });
      }

      await promiser('exec', {
        bind: [migration.name],
        dbId: databaseId,
        sql: 'INSERT INTO __drizzle_migrations (name) VALUES (?)',
      });

      await promiser('exec', { dbId: databaseId, sql: 'COMMIT' });

      // eslint-disable-next-line no-console -- migration progress must be visible in DevTools for debugging
      console.log(`[migrations] Applied ${migration.name}`);
    } catch (error) {
      await promiser('exec', { dbId: databaseId, sql: 'ROLLBACK' }).catch(
        () => undefined,
      );
      throw new MigrationError(migration.name, error);
    }
  }
};
