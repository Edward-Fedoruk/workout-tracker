import {
  createExercise,
  deleteExercise,
  type Exercise,
  listExercises,
  updateExercise,
} from '../../../../database';
import { useToggle } from '../../../../hooks/useToggle';
import { type FormValues } from '../../ExerciseForm.schema';
import { useState } from 'react';

export type UseExercisesReturn = ReturnType<typeof useExercises>;

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
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
    dialog.onOpen();
  };

  const openEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setDialogMode('edit');
    dialog.onOpen();
  };

  const handleSave = async (values: FormValues): Promise<null | string> => {
    const lowerName = values.name.toLowerCase();
    const isDuplicate = exercises.some(
      (item) =>
        item.name.toLowerCase() === lowerName &&
        item.id !== editingExercise?.id,
    );
    if (isDuplicate) {
      return 'An exercise with this name already exists';
    }

    if (dialogMode === 'edit' && editingExercise) {
      await updateExercise(
        editingExercise.id,
        values.name,
        values.muscleGroupIds,
        values.classification,
      );
    } else {
      await createExercise(
        values.name,
        values.muscleGroupIds,
        values.classification,
      );
    }

    await refresh();
    dialog.onClose();
    return null;
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
