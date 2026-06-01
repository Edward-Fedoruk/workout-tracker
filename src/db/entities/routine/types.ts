import { type RoutineExercise } from '../routine-exercise/types';
import { type routine } from './schema';

export type Routine = typeof routine.$inferSelect;
export type RoutineWithExercises = Routine & { exercises: RoutineExercise[] };
