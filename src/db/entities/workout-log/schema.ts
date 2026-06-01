import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const workoutLog = sqliteTable('workout_log', {
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  exerciseName: text('exercise_name').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  workoutDate: text('workout_date').notNull(),
});
