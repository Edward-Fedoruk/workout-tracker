import { appSetting } from './schema';
import { database } from '@/db/orm';
import { eq } from 'drizzle-orm';

const BODY_WEIGHT_KEY = 'body_weight';
const MAX_BODY_WEIGHT_KG = 500;

const EXERCISE_NAMES_IN_TABLES_KEY = 'exercise_names_in_tables';

class AppSettingRepository {
  async getBodyWeight(): Promise<null | number> {
    const rows = await database
      .select({ value: appSetting.value })
      .from(appSetting)
      .where(eq(appSetting.key, BODY_WEIGHT_KEY));

    const row = rows[0];
    if (row === undefined) {
      return null;
    }

    const parsed = Number.parseFloat(row.value);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  }

  async getExerciseNamesInTables(): Promise<boolean> {
    const rows = await database
      .select({ value: appSetting.value })
      .from(appSetting)
      .where(eq(appSetting.key, EXERCISE_NAMES_IN_TABLES_KEY));

    return rows[0]?.value === 'true';
  }

  async setBodyWeight(kg: number): Promise<void> {
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

    await database
      .insert(appSetting)
      .values({ key: BODY_WEIGHT_KEY, value: kg.toFixed(2) })
      .onConflictDoUpdate({
        set: { value: kg.toFixed(2) },
        target: appSetting.key,
      });
  }

  async setExerciseNamesInTables(enabled: boolean): Promise<void> {
    const value = enabled ? 'true' : 'false';
    await database
      .insert(appSetting)
      .values({ key: EXERCISE_NAMES_IN_TABLES_KEY, value })
      .onConflictDoUpdate({
        set: { value },
        target: appSetting.key,
      });
  }
}

export const appSettingRepository = new AppSettingRepository();
