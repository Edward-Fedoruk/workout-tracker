import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

export const routine = sqliteTable(
  'routine',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [check('routine_name_length', sql`length(${table.name}) <= 100`)],
);

export const routineExercise = sqliteTable(
  'routine_exercise',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    routineId: integer('routine_id')
      .notNull()
      .references(() => routine.id, { onDelete: 'cascade' }),
    exerciseName: text('exercise_name').notNull(),
    suggestedSets: integer('suggested_sets').notNull(),
    suggestedReps: integer('suggested_reps').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    unique().on(table.routineId, table.position),
    check(
      'suggested_sets_check',
      sql`${table.suggestedSets} BETWEEN 1 AND 5`,
    ),
    check(
      'suggested_reps_check',
      sql`${table.suggestedReps} BETWEEN 1 AND 99`,
    ),
    check('position_check', sql`${table.position} >= 1`),
  ],
);

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
