import { type MuscleGroup } from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type FormValues } from '@/routes/exercises/MuscleGroup/MuscleGroupForm/schema';
import {
  useCreateMuscleGroupMutation,
  useDeleteMuscleGroupMutation,
  useListMuscleGroupsQuery,
  useUpdateMuscleGroupMutation,
} from '@/store/entities/muscleGroups';
import { useState } from 'react';

export type UseMuscleGroupsReturn = ReturnType<typeof useMuscleGroups>;

export const useMuscleGroups = () => {
  const { data: muscleGroups = [] } = useListMuscleGroupsQuery();
  const [createMuscleGroup] = useCreateMuscleGroupMutation();
  const [updateMuscleGroup] = useUpdateMuscleGroupMutation();
  const [deleteMuscleGroup] = useDeleteMuscleGroupMutation();

  const [editingMuscleGroup, setEditingMuscleGroup] =
    useState<MuscleGroup | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [pendingDelete, setPendingDelete] = useState<MuscleGroup | null>(null);

  const dialog = useToggle();
  const deleteConfirm = useToggle();

  // Cache invalidation keeps the list fresh; kept as a resolved no-op so the
  // view's mount-time call stays valid (HR-2).
  const refresh = async (): Promise<void> => undefined;

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
      await updateMuscleGroup({
        color: values.color,
        id: editingMuscleGroup.id,
        name: values.name,
      }).unwrap();
    } else {
      await createMuscleGroup({
        color: values.color,
        name: values.name,
      }).unwrap();
    }

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
    await deleteMuscleGroup(target.id).unwrap();
    await onAfterDelete?.();
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
