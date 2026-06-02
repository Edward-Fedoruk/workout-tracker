import {
  createMuscleGroup,
  deleteMuscleGroup,
  listMuscleGroups,
  type MuscleGroup,
  updateMuscleGroup,
} from '../../../../database';
import { useToggle } from '../../../../hooks/useToggle';
import { type FormValues } from '../../MuscleGroupForm.schema';
import { useState } from 'react';

export type UseMuscleGroupsReturn = ReturnType<typeof useMuscleGroups>;

export const useMuscleGroups = () => {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [editingMuscleGroup, setEditingMuscleGroup] =
    useState<MuscleGroup | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [pendingDelete, setPendingDelete] = useState<MuscleGroup | null>(null);

  const dialog = useToggle();
  const deleteConfirm = useToggle();

  const refresh = async () => {
    const list = await listMuscleGroups();
    setMuscleGroups(list);
  };

  const openCreate = () => {
    setEditingMuscleGroup(null);
    setDialogMode('create');
    dialog.onOpen();
  };

  const openRename = (group: MuscleGroup) => {
    setEditingMuscleGroup(group);
    setDialogMode('edit');
    dialog.onOpen();
  };

  const handleSave = async (values: FormValues): Promise<null | string> => {
    const lowerName = values.name.toLowerCase();
    const isDuplicate = muscleGroups.some(
      (item) =>
        item.name.toLowerCase() === lowerName &&
        item.id !== editingMuscleGroup?.id,
    );
    if (isDuplicate) {
      return 'A muscle group with this name already exists';
    }

    if (dialogMode === 'edit' && editingMuscleGroup) {
      await updateMuscleGroup(editingMuscleGroup.id, values.name, values.color);
    } else {
      await createMuscleGroup(values.name, values.color);
    }

    await refresh();
    dialog.onClose();
    return null;
  };

  const requestDelete = (group: MuscleGroup) => {
    setPendingDelete(group);
    deleteConfirm.onOpen();
  };

  const confirmDelete = async (onAfterDelete?: () => Promise<void>) => {
    if (!pendingDelete) {
      return;
    }

    const target = pendingDelete;
    setPendingDelete(null);
    deleteConfirm.onClose();
    await deleteMuscleGroup(target.id);
    await Promise.all([refresh(), onAfterDelete?.()]);
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
    editingMuscleGroup,
    handleSave,
    muscleGroups,
    openCreate,
    openRename,
    pendingDelete,
    refresh,
    requestDelete,
  };
};
