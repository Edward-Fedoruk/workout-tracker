import { type routineExercise } from './schema';

export type LastExerciseSets = Array<{
  reps: number;
  setNumber: number;
  weight: null | number;
}>;

export type RoutineExercise = typeof routineExercise.$inferSelect;
