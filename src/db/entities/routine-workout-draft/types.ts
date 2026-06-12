export type RoutineWorkoutDraft = {
  draftData: StoredDraftData;
  id: 1;
  routineId: number;
  updatedAt: string;
};

export type StoredDraftData = Record<string, StoredSetValues>;

export type StoredSetValues = Array<{
  completed?: boolean;
  reps: null | number;
  weight: null | number;
}>;
