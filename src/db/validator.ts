import { type Promiser } from './driver';
import { MigrationError } from './migrations';
import { workoutLog, workoutSet } from './schema';

type TableInfo = {
  name: string;
};

const getExpectedColumns = (
  table: typeof workoutLog | typeof workoutSet,
): string[] => {
  return Object.values(table).map((col) => (col as { name: string }).name);
};

const validateTable = async (
  promiser: Promiser,
  databaseId: string,
  tableName: string,
  expectedColumns: string[],
): Promise<void> => {
  const result = await promiser<TableInfo>('exec', {
    dbId: databaseId,
    rowMode: 'object',
    sql: `PRAGMA table_info(${tableName})`,
  });

  const actualColumns = new Set(
    (result.result.resultRows || []).map((row) => row.name),
  );

  const missing = expectedColumns.filter((col) => !actualColumns.has(col));
  if (missing.length > 0) {
    throw new MigrationError(
      tableName,
      new Error(
        `Schema validation failed for "${tableName}": missing columns: ${missing.join(', ')}`,
      ),
    );
  }
};

export const validateSchema = async (
  promiser: Promiser,
  databaseId: string,
): Promise<void> => {
  await validateTable(
    promiser,
    databaseId,
    'workout_log',
    getExpectedColumns(workoutLog),
  );
  await validateTable(
    promiser,
    databaseId,
    'workout_set',
    getExpectedColumns(workoutSet),
  );
};
