import { type MuscleGroup } from '../muscle-group/types';
import { type exercise } from './schema';

export type { MuscleGroup } from '../muscle-group/types';
export type Exercise = ExerciseRow & { muscleGroups: MuscleGroup[] };
export type ExerciseClassification = 'bodyweight' | 'standard';
export type ExerciseRow = typeof exercise.$inferSelect;
