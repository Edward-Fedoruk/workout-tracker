import { getDatabaseId, getPromiser } from './driver';
import { initDatabase } from './initDatabase';

type AppSettingRow = {
  value: string;
};

const BODY_WEIGHT_KEY = 'body_weight';
const MAX_BODY_WEIGHT_KG = 500;

export const getBodyWeight = async (): Promise<null | number> => {
  await initDatabase();
  const promiser = await getPromiser();
  const result = await promiser<AppSettingRow>('exec', {
    bind: [BODY_WEIGHT_KEY],
    dbId: getDatabaseId(),
    rowMode: 'object',
    sql: 'SELECT value FROM app_setting WHERE key = ?',
  });
  const row = (result.result.resultRows || [])[0];
  if (row === undefined) {
    return null;
  }

  const parsed = Number.parseFloat(row.value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
};

export const setBodyWeight = async (kg: number): Promise<void> => {
  if (!Number.isFinite(kg)) {
    throw new TypeError('Body weight must be a finite number');
  }

  if (kg <= 0) {
    throw new Error('Body weight must be greater than 0');
  }

  if (kg > MAX_BODY_WEIGHT_KG) {
    throw new Error(`Body weight must be ${MAX_BODY_WEIGHT_KG} kg or less`);
  }

  if (Math.round(kg * 100) / 100 !== kg) {
    throw new Error('Body weight must have at most 2 decimal places');
  }

  await initDatabase();
  const promiser = await getPromiser();
  await promiser('exec', {
    bind: [BODY_WEIGHT_KEY, kg.toFixed(2)],
    dbId: getDatabaseId(),
    sql: 'INSERT INTO app_setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  });
};
