import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

export const routine = sqliteTable(
  'routine',
  {
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [check('routine_name_length', sql`length(${table.name}) <= 100`)],
);

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

export const workoutLog = sqliteTable('workout_log', {
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  exerciseName: text('exercise_name').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  workoutDate: text('workout_date').notNull(),
});

export const exercise = sqliteTable('exercise', {
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const muscleGroup = sqliteTable('muscle_group', {
  color: text('color').notNull().default('#757575'),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

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
