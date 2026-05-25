import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

export const workoutLog = sqliteTable('workout_log', {
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  exerciseName: text('exercise_name').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  workoutDate: text('workout_date').notNull(),
});

export const workoutSet = sqliteTable(
  'workout_set',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reps: integer('reps').notNull(),
    setNumber: integer('set_number').notNull(),
    weight: real('weight').notNull(),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workoutLog.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.workoutId, table.setNumber),
    check('set_number_check', sql`${table.setNumber} BETWEEN 1 AND 5`),
    check('weight_check', sql`${table.weight} > 0`),
    check('reps_check', sql`${table.reps} > 0`),
  ],
);
