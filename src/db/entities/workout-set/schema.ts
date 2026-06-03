import { workoutLog } from '@/db/entities/workout-log/schema';
import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  real,
  sqliteTable,
  unique,
} from 'drizzle-orm/sqlite-core';

export const workoutSet = sqliteTable(
  'workout_set',
  {
    erm: real('erm'),
    id: integer('id').primaryKey({ autoIncrement: true }),
    reps: integer('reps').notNull(),
    setNumber: integer('set_number').notNull(),
    weight: real('weight'),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workoutLog.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.workoutId, table.setNumber),
    check('set_number_check', sql`${table.setNumber} BETWEEN 1 AND 5`),
    check('reps_check', sql`${table.reps} > 0`),
  ],
);
