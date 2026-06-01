import {
  createExercise,
  deleteExercise,
  type Exercise,
  type ExerciseClassification,
  listExercises,
  updateExercise,
} from '../../../../database';
import { useToggle } from '../../../../hooks/useToggle';
import { useState } from 'react';

export type UseExercisesReturn = ReturnType<typeof useExercises>;

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [duplicateError, setDuplicateError] = useState<null | string>(null);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);

  const dialog = useToggle();
  const deleteConfirm = useToggle();

  const refresh = async () => {
    const list = await listExercises();
    setExercises(list);
  };

  const openCreate = () => {
    setEditingExercise(null);
    setDialogMode('create');
    setDuplicateError(null);
    dialog.onOpen();
  };

  const openEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setDialogMode('edit');
    setDuplicateError(null);
    dialog.onOpen();
  };

  const handleSave = async (
    name: string,
    muscleGroupIds: number[],
    classification: ExerciseClassification,
  ) => {
    const lowerName = name.toLowerCase();
    const isDuplicate = exercises.some(
      (item) =>
        item.name.toLowerCase() === lowerName &&
        item.id !== editingExercise?.id,
    );
    if (isDuplicate) {
      setDuplicateError('An exercise with this name already exists');
      return;
    }

    setDuplicateError(null);

    if (dialogMode === 'edit' && editingExercise) {
      await updateExercise(
        editingExercise.id,
        name,
        muscleGroupIds,
        classification,
      );
    } else {
      await createExercise(name, muscleGroupIds, classification);
    }

    await refresh();
    dialog.onClose();
  };

  const requestDelete = (exercise: Exercise) => {
    setPendingDelete(exercise);
    deleteConfirm.onOpen();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    const target = pendingDelete;
    setPendingDelete(null);
    deleteConfirm.onClose();
    await deleteExercise(target.id);
    await refresh();
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    deleteConfirm.onClose();
  };

  return {
    cancelDelete,
    confirmDelete,
    deleteConfirm,
    dialog,
    dialogMode,
    duplicateError,
    editingExercise,
    exercises,
    handleSave,
    openCreate,
    openEdit,
    pendingDelete,
    refresh,
    requestDelete,
  };
};
