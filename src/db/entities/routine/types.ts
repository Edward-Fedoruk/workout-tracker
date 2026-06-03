import { type routine } from './schema';
import { type RoutineExercise } from '@/db/entities/routine-exercise/types';

export type Routine = typeof routine.$inferSelect;
export type RoutineWithExercises = Routine & { exercises: RoutineExercise[] };
