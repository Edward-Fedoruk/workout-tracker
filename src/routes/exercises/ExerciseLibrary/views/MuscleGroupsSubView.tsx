import { ConfirmDialog } from '@/components/ConfirmDialog';
import { type UseMuscleGroupsReturn } from '@/routes/exercises/ExerciseLibrary/hooks/useMuscleGroups';
import { MuscleGroupForm } from '@/routes/exercises/MuscleGroup/MuscleGroupForm';
import { MuscleGroupList } from '@/routes/exercises/MuscleGroup/MuscleGroupList';
import { DialogContentText } from '@mui/material';

export type MuscleGroupsSubViewProps = UseMuscleGroupsReturn & {
  readonly onAfterDelete: () => Promise<void>;
};

export const MuscleGroupsSubView = ({
  cancelDelete,
  confirmDelete,
  deleteConfirm,
  dialog,
  dialogMode,
  editingMuscleGroup,
  handleSave,
  muscleGroups,
  onAfterDelete,
  openRename,
  pendingDelete,
  requestDelete,
}: MuscleGroupsSubViewProps) => (
  <>
    <MuscleGroupList
      muscleGroups={muscleGroups}
      onDelete={requestDelete}
      onRename={openRename}
    />

    <MuscleGroupForm
      initialValues={
        editingMuscleGroup
          ? { color: editingMuscleGroup.color, name: editingMuscleGroup.name }
          : undefined
      }
      mode={dialogMode}
      onCancel={() => {
        dialog.onClose();
      }}
      onSave={handleSave}
      open={dialog.isOpen}
    />

    <ConfirmDialog
      confirmColor="error"
      confirmLabel="Delete"
      onCancel={cancelDelete}
      onConfirm={() => {
        confirmDelete(onAfterDelete).catch(() => undefined);
      }}
      open={deleteConfirm.isOpen}
      title="Delete muscle group?"
    >
      <DialogContentText>
        Delete &ldquo;{pendingDelete?.name}&rdquo;? Exercises using this group
        will be unassigned but remain in the library.
      </DialogContentText>
    </ConfirmDialog>
  </>
);
