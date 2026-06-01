import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { MuscleGroupForm } from '../../MuscleGroupForm';
import { MuscleGroupList } from '../../MuscleGroupList';
import { type UseMuscleGroupsReturn } from '../hooks/useMuscleGroups';
import AddIcon from '@mui/icons-material/Add';
import { Button, DialogContentText, Stack } from '@mui/material';

type Props = UseMuscleGroupsReturn & {
  readonly onAfterDelete: () => Promise<void>;
};

export const MuscleGroupsSubView = ({
  cancelDelete,
  confirmDelete,
  deleteConfirm,
  dialog,
  dialogMode,
  duplicateError,
  editingMuscleGroup,
  handleSave,
  muscleGroups,
  onAfterDelete,
  openCreate,
  openRename,
  pendingDelete,
  requestDelete,
}: Props) => (
  <>
    <Stack
      direction="row"
      sx={{ justifyContent: 'flex-end', mb: 2 }}
    >
      <Button
        onClick={openCreate}
        startIcon={<AddIcon />}
        sx={{ minHeight: 44 }}
        variant="contained"
      >
        Add muscle group
      </Button>
    </Stack>

    <MuscleGroupList
      muscleGroups={muscleGroups}
      onDelete={requestDelete}
      onRename={openRename}
    />

    <MuscleGroupForm
      duplicateError={duplicateError}
      initialColor={editingMuscleGroup?.color}
      initialName={editingMuscleGroup?.name}
      mode={dialogMode}
      onCancel={() => {
        dialog.onClose();
      }}
      onSave={(name, color) => {
        handleSave(name, color).catch(() => undefined);
      }}
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
