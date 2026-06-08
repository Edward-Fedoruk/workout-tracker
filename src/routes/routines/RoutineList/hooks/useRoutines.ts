import {
  deleteRoutine,
  getDraft,
  listRoutines,
  type RoutineWithExercises,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { useState } from 'react';

export type UseRoutinesReturn = ReturnType<typeof useRoutines>;

export const useRoutines = () => {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [draftRoutineId, setDraftRoutineId] = useState<null | number>(null);
  const [pendingDelete, setPendingDelete] =
    useState<null | RoutineWithExercises>(null);

  const deleteConfirm = useToggle();

  const refresh = async () => {
    const [list, draft] = await Promise.all([listRoutines(), getDraft()]);
    setRoutines(list);
    setDraftRoutineId(draft ? draft.routineId : null);
  };

  const requestDelete = (routine: RoutineWithExercises) => {
    setPendingDelete(routine);
    deleteConfirm.onOpen();
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    deleteConfirm.onClose();
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    const target = pendingDelete;
    setPendingDelete(null);
    deleteConfirm.onClose();
    await deleteRoutine(target.id);
    await refresh();
  };

  return {
    cancelDelete,
    deleteConfirm,
    draftRoutineId,
    handleConfirmDelete,
    pendingDelete,
    refresh,
    requestDelete,
    routines,
  };
};
