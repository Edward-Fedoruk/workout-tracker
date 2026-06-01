import { database } from '../../orm';
import { routineExercise } from '../routine-exercise/schema';
import { type RoutineExercise } from '../routine-exercise/types';
import { routine } from './schema';
import { type RoutineWithExercises } from './types';
import { eq, sql } from 'drizzle-orm';

class RoutineRepository {
  async create(name: string): Promise<number> {
    const inserted = await database
      .insert(routine)
      .values({ name })
      .returning({ id: routine.id });

    const id = inserted[0]?.id;
    if (id === undefined) {
      throw new Error('INSERT routine failed: no row returned');
    }

    return id;
  }

  async delete(id: number): Promise<void> {
    await database.delete(routine).where(eq(routine.id, id));
  }

  async getById(id: number): Promise<null | RoutineWithExercises> {
    const routines = await database
      .select()
      .from(routine)
      .where(eq(routine.id, id));

    const routineRow = routines[0];
    if (!routineRow) {
      return null;
    }

    const exercises = await database
      .select()
      .from(routineExercise)
      .where(eq(routineExercise.routineId, id))
      .orderBy(routineExercise.position);

    return { ...routineRow, exercises };
  }

  async list(): Promise<RoutineWithExercises[]> {
    const routines = await database
      .select()
      .from(routine)
      .orderBy(routine.createdAt);

    const exercises = await database
      .select()
      .from(routineExercise)
      .orderBy(routineExercise.routineId, routineExercise.position);

    const exercisesByRoutineId = new Map<number, RoutineExercise[]>();
    for (const exercise of exercises) {
      const list = exercisesByRoutineId.get(exercise.routineId) ?? [];
      list.push(exercise);
      exercisesByRoutineId.set(exercise.routineId, list);
    }

    return routines.map((routineRow) => ({
      ...routineRow,
      exercises: exercisesByRoutineId.get(routineRow.id) ?? [],
    }));
  }

  async update(id: number, name: string): Promise<void> {
    await database
      .update(routine)
      .set({ name, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(routine.id, id));
  }
}

export const routineRepository = new RoutineRepository();
