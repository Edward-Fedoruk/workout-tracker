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
    exerciseName: text('exercise_name').notNull(),
    minReps: integer('min_reps').notNull(),
    maxReps: integer('max_reps').notNull(),
    suggestedSets: integer('suggested_sets').notNull(),
    position: integer('position').notNull(),
    routineId: integer('routine_id')
      .notNull()
      .references(() => routine.id, { onDelete: 'cascade' }),
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
  id: integer('id').primaryKey({ autoIncrement: true }),
  exerciseName: text('exercise_name').notNull(),
  workoutDate: text('workout_date').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const exercise = sqliteTable(
  'exercise',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    classification: text('classification', {
      enum: ['standard', 'bodyweight', 'assisted'],
    })
      .notNull()
      .default('standard'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      'exercise_classification_check',
      sql`${table.classification} IN ('standard', 'bodyweight', 'assisted')`,
    ),
  ],
);

export const appSetting = sqliteTable('app_setting', {
  key: text('key').notNull().primaryKey(),
  value: text('value').notNull(),
});

export const muscleGroup = sqliteTable('muscle_group', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#757575'),
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
    weight: real('weight'),
    erm: real('erm'),
    setNumber: integer('set_number').notNull(),
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
