import { getDraft, listRoutines, type RoutineWithExercises } from '@/database';
import { useState } from 'react';

export type UseRoutinesReturn = ReturnType<typeof useRoutines>;

export const useRoutines = () => {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [draftRoutineId, setDraftRoutineId] = useState<null | number>(null);

  const refresh = async () => {
    const [list, draft] = await Promise.all([listRoutines(), getDraft()]);
    setRoutines(list);
    setDraftRoutineId(draft ? draft.routineId : null);
  };

  return {
    draftRoutineId,
    refresh,
    routines,
  };
};
