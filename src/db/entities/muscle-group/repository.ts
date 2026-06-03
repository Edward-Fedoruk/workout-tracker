import { muscleGroup } from './schema';
import { type MuscleGroup } from './types';
import { database } from '@/db/orm';
import { eq } from 'drizzle-orm';

class MuscleGroupRepository {
  async create(name: string, color: string): Promise<number> {
    const inserted = await database
      .insert(muscleGroup)
      .values({ color, name })
      .returning({ id: muscleGroup.id });

    const id = inserted[0]?.id;
    if (id === undefined) {
      throw new Error('INSERT muscle_group failed: no row returned');
    }

    return id;
  }

  async delete(id: number): Promise<void> {
    await database.delete(muscleGroup).where(eq(muscleGroup.id, id));
  }

  async list(): Promise<MuscleGroup[]> {
    return database.select().from(muscleGroup).orderBy(muscleGroup.name);
  }

  async update(id: number, name: string, color: string): Promise<void> {
    await database
      .update(muscleGroup)
      .set({ color, name })
      .where(eq(muscleGroup.id, id));
  }
}

export const muscleGroupRepository = new MuscleGroupRepository();
