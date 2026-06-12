import { exercise, exerciseMuscleGroup } from './schema';
import { type Exercise, type ExerciseClassification } from './types';
import { getDatabaseId, getPromiser } from '@/db/driver';
import { type MuscleGroup } from '@/db/entities/muscle-group/types';
import { database } from '@/db/orm';
import { eq } from 'drizzle-orm';

type ExerciseMuscleGroupRow = {
  exercise_id: number;
  muscle_group_color: string;
  muscle_group_id: number;
  muscle_group_name: string;
};

type ExerciseRow = {
  classification: ExerciseClassification;
  created_at: string;
  id: number;
  image_filename: null | string;
  name: string;
};

class ExerciseRepository {
  async create(
    name: string,
    muscleGroupIds: number[],
    classification: ExerciseClassification,
    imageFilename?: null | string,
  ): Promise<number> {
    return database.transaction(async (tx) => {
      const inserted = await tx
        .insert(exercise)
        .values({ classification, imageFilename: imageFilename ?? null, name })
        .returning({ id: exercise.id });

      const id = inserted[0]?.id;
      if (id === undefined) {
        throw new Error('INSERT exercise failed: no row returned');
      }

      for (const muscleGroupId of muscleGroupIds) {
        await tx
          .insert(exerciseMuscleGroup)
          .values({ exerciseId: id, muscleGroupId });
      }

      return id;
    });
  }

  async delete(id: number): Promise<void> {
    const promiser = await getPromiser();
    const databaseId = getDatabaseId();

    const nameResult = await promiser<{ name: string }>('exec', {
      bind: [id],
      dbId: databaseId,
      rowMode: 'object',
      sql: 'SELECT name FROM exercise WHERE id = ?',
    });
    const name = nameResult.result.resultRows[0]?.name;
    if (name === undefined) {
      return;
    }

    await database.transaction(async (tx) => {
      await promiser('exec', {
        bind: [name],
        dbId: databaseId,
        sql: 'DELETE FROM routine_exercise WHERE exercise_name = ?',
      });
      await tx.delete(exercise).where(eq(exercise.id, id));
    });
  }

  async getById(id: number): Promise<Exercise | null> {
    const promiser = await getPromiser();
    const databaseId = getDatabaseId();

    const exercisesResult = await promiser<ExerciseRow>('exec', {
      bind: [id],
      dbId: databaseId,
      rowMode: 'object',
      sql: 'SELECT id, name, created_at, classification, image_filename FROM exercise WHERE id = ?',
    });

    const row = exercisesResult.result.resultRows[0];
    if (!row) {
      return null;
    }

    const joinResult = await promiser<ExerciseMuscleGroupRow>('exec', {
      bind: [id],
      dbId: databaseId,
      rowMode: 'object',
      sql: `
        SELECT emg.exercise_id, mg.id AS muscle_group_id, mg.name AS muscle_group_name, mg.color AS muscle_group_color
        FROM exercise_muscle_group emg
        JOIN muscle_group mg ON mg.id = emg.muscle_group_id
        WHERE emg.exercise_id = ?
        ORDER BY mg.name COLLATE NOCASE ASC
      `,
    });

    const muscleGroups: MuscleGroup[] = (
      joinResult.result.resultRows || []
    ).map((mgRow) => ({
      color: mgRow.muscle_group_color,
      id: mgRow.muscle_group_id,
      name: mgRow.muscle_group_name,
    }));

    return {
      classification: row.classification,
      createdAt: row.created_at,
      id: row.id,
      imageFilename: row.image_filename,
      muscleGroups,
      name: row.name,
    };
  }

  async list(): Promise<Exercise[]> {
    const promiser = await getPromiser();
    const databaseId = getDatabaseId();

    const exercisesResult = await promiser<ExerciseRow>('exec', {
      dbId: databaseId,
      rowMode: 'object',
      sql: 'SELECT id, name, created_at, classification, image_filename FROM exercise ORDER BY name COLLATE NOCASE ASC',
    });

    const joinResult = await promiser<ExerciseMuscleGroupRow>('exec', {
      dbId: databaseId,
      rowMode: 'object',
      sql: `
        SELECT emg.exercise_id, mg.id AS muscle_group_id, mg.name AS muscle_group_name, mg.color AS muscle_group_color
        FROM exercise_muscle_group emg
        JOIN muscle_group mg ON mg.id = emg.muscle_group_id
        ORDER BY mg.name COLLATE NOCASE ASC
      `,
    });

    const groupsByExerciseId = new Map<number, MuscleGroup[]>();
    for (const row of joinResult.result.resultRows || []) {
      const list = groupsByExerciseId.get(row.exercise_id) ?? [];
      list.push({
        color: row.muscle_group_color,
        id: row.muscle_group_id,
        name: row.muscle_group_name,
      });
      groupsByExerciseId.set(row.exercise_id, list);
    }

    return (exercisesResult.result.resultRows || []).map((row) => ({
      classification: row.classification,
      createdAt: row.created_at,
      id: row.id,
      imageFilename: row.image_filename,
      muscleGroups: groupsByExerciseId.get(row.id) ?? [],
      name: row.name,
    }));
  }

  async update(
    id: number,
    name: string,
    muscleGroupIds: number[],
    classification: ExerciseClassification,
    imageFilename?: null | string,
  ): Promise<void> {
    const promiser = await getPromiser();
    const databaseId = getDatabaseId();

    const oldResult = await promiser<{ name: string }>('exec', {
      bind: [id],
      dbId: databaseId,
      rowMode: 'object',
      sql: 'SELECT name FROM exercise WHERE id = ?',
    });
    const oldName = oldResult.result.resultRows[0]?.name;
    if (oldName === undefined) {
      throw new Error(`Exercise ${id} not found`);
    }

    await database.transaction(async (tx) => {
      await tx
        .update(exercise)
        .set({ classification, imageFilename: imageFilename ?? null, name })
        .where(eq(exercise.id, id));

      if (oldName !== name) {
        await promiser('exec', {
          bind: [name, oldName],
          dbId: databaseId,
          sql: 'UPDATE workout_log SET exercise_name = ? WHERE exercise_name = ?',
        });
        await promiser('exec', {
          bind: [name, oldName],
          dbId: databaseId,
          sql: 'UPDATE routine_exercise SET exercise_name = ? WHERE exercise_name = ?',
        });
      }

      await tx
        .delete(exerciseMuscleGroup)
        .where(eq(exerciseMuscleGroup.exerciseId, id));

      for (const muscleGroupId of muscleGroupIds) {
        await tx
          .insert(exerciseMuscleGroup)
          .values({ exerciseId: id, muscleGroupId });
      }
    });
  }
}

export const exerciseRepository = new ExerciseRepository();
