import {
  deleteRoutine,
  listRoutines,
  type RoutineWithExercises,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { useState } from 'react';

export type UseRoutinesReturn = ReturnType<typeof useRoutines>;

export const useRoutines = () => {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [pendingDelete, setPendingDelete] =
    useState<null | RoutineWithExercises>(null);

  const deleteConfirm = useToggle();

  const refresh = async () => {
    const list = await listRoutines();
    setRoutines(list);
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
    handleConfirmDelete,
    pendingDelete,
    refresh,
    requestDelete,
    routines,
  };
};
