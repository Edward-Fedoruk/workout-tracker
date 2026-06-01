import { routine } from '../routine/schema';
import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

export const routineExercise = sqliteTable(
  'routine_exercise',
  {
    exerciseName: text('exercise_name').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    maxReps: integer('max_reps').notNull(),
    minReps: integer('min_reps').notNull(),
    position: integer('position').notNull(),
    routineId: integer('routine_id')
      .notNull()
      .references(() => routine.id, { onDelete: 'cascade' }),
    suggestedSets: integer('suggested_sets').notNull(),
  },
  (table) => [
    unique().on(table.routineId, table.position),
    check('suggested_sets_check', sql`${table.suggestedSets} BETWEEN 1 AND 5`),
    check('min_reps_check', sql`${table.minReps} BETWEEN 1 AND 99`),
    check('max_reps_check', sql`${table.maxReps} BETWEEN 1 AND 99`),
    check('position_check', sql`${table.position} >= 1`),
  ],
);
