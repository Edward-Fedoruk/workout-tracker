import { type WorkoutSet } from '../workout-set/types';
import { type workoutLog } from './schema';

export type { WorkoutSet } from '../workout-set/types';
export type WorkoutLog = typeof workoutLog.$inferSelect;
export type WorkoutTableRow = {
  exercise_name: string;
  id: number;
  Set1_erm: null | number;
  Set1_reps: null | number;
  Set1_weight: null | number;
  Set2_erm: null | number;
  Set2_reps: null | number;
  Set2_weight: null | number;
  Set3_erm: null | number;
  Set3_reps: null | number;
  Set3_weight: null | number;
  Set4_erm: null | number;
  Set4_reps: null | number;
  Set4_weight: null | number;
  Set5_erm: null | number;
  Set5_reps: null | number;
  Set5_weight: null | number;
  workout_date: string;
};

export type WorkoutWithSets = WorkoutLog & { sets: WorkoutSet[] };
