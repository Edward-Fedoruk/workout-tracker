import { muscleGroup } from '@/db/entities/muscle-group/schema';
import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const exercise = sqliteTable(
  'exercise',
  {
    classification: text('classification', {
      enum: ['standard', 'bodyweight'],
    })
      .notNull()
      .default('standard'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
  },
  (table) => [
    check(
      'exercise_classification_check',
      sql`${table.classification} IN ('standard', 'bodyweight')`,
    ),
  ],
);

export const exerciseMuscleGroup = sqliteTable(
  'exercise_muscle_group',
  {
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercise.id, { onDelete: 'cascade' }),
    muscleGroupId: integer('muscle_group_id')
      .notNull()
      .references(() => muscleGroup.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.exerciseId, table.muscleGroupId] })],
);
