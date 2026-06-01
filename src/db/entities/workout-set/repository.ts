import { database } from '../../orm';
import { workoutSet } from './schema';
import { eq } from 'drizzle-orm';

class WorkoutSetRepository {
  async deleteByWorkoutId(workoutId: number): Promise<void> {
    await database
      .delete(workoutSet)
      .where(eq(workoutSet.workoutId, workoutId));
  }

  async insertMany(
    workoutId: number,
    sets: Array<{ erm: null | number; reps: number; weight: null | number }>,
  ): Promise<void> {
    if (sets.length === 0) {
      return;
    }

    await database.insert(workoutSet).values(
      sets.map((set, index) => ({
        erm: set.erm,
        reps: set.reps,
        setNumber: index + 1,
        weight: set.weight,
        workoutId,
      })),
    );
  }
}

export const workoutSetRepository = new WorkoutSetRepository();
