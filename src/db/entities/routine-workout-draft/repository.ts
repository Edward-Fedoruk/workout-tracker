import { routineWorkoutDraft } from './schema';
import { type RoutineWorkoutDraft, type StoredDraftData } from './types';
import { database } from '@/db/orm';
import { sql } from 'drizzle-orm';

class RoutineWorkoutDraftRepository {
  async clear(): Promise<void> {
    await database.delete(routineWorkoutDraft);
  }

  async get(): Promise<null | RoutineWorkoutDraft> {
    const rows = await database.select().from(routineWorkoutDraft);
    const row = rows[0];
    if (!row) {
      return null;
    }

    let parsed: StoredDraftData;
    try {
      parsed = JSON.parse(row.draftData) as StoredDraftData;
    } catch {
      // Malformed JSON — treat as no draft (FR-008 graceful degradation).
      return null;
    }

    return {
      draftData: parsed,
      id: 1,
      routineId: row.routineId,
      updatedAt: row.updatedAt,
    };
  }

  async save(routineId: number, data: StoredDraftData): Promise<void> {
    const draftData = JSON.stringify(data);
    await database
      .insert(routineWorkoutDraft)
      .values({ draftData, id: 1, routineId })
      .onConflictDoUpdate({
        set: { draftData, routineId, updatedAt: sql`CURRENT_TIMESTAMP` },
        target: routineWorkoutDraft.id,
      });
  }
}

export const routineWorkoutDraftRepository =
  new RoutineWorkoutDraftRepository();
