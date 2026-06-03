import { type exercise } from './schema';
import { type MuscleGroup } from '@/db/entities/muscle-group/types';

export type { MuscleGroup } from '@/db/entities/muscle-group/types';
export type Exercise = ExerciseRow & { muscleGroups: MuscleGroup[] };
export type ExerciseClassification = 'bodyweight' | 'standard';
export type ExerciseRow = typeof exercise.$inferSelect;
