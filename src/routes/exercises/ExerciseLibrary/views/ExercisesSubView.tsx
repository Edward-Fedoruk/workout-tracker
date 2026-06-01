import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { type MuscleGroup } from '../../../../database';
import { ExerciseForm } from '../../ExerciseForm';
import { ExerciseList } from '../../ExerciseList';
import { type UseExercisesReturn } from '../hooks/useExercises';
import AddIcon from '@mui/icons-material/Add';
import { Button, DialogContentText, Stack } from '@mui/material';

type Props = UseExercisesReturn & {
  readonly muscleGroups: MuscleGroup[];
};

export const ExercisesSubView = ({
  cancelDelete,
  confirmDelete,
  deleteConfirm,
  dialog,
  dialogMode,
  duplicateError,
  editingExercise,
  exercises,
  handleSave,
  muscleGroups,
  openCreate,
  openEdit,
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
        Add exercise
      </Button>
    </Stack>

    <ExerciseList
      exercises={exercises}
      onDelete={requestDelete}
      onEdit={openEdit}
    />

    <ExerciseForm
      duplicateError={duplicateError}
      initialValues={
        editingExercise
          ? {
              classification: editingExercise.classification,
              muscleGroupIds: editingExercise.muscleGroups.map(
                (group) => group.id,
              ),
              name: editingExercise.name,
            }
          : undefined
      }
      mode={dialogMode}
      muscleGroups={muscleGroups}
      onCancel={() => {
        dialog.onClose();
      }}
      onSave={(name, ids, classification) => {
        handleSave(name, ids, classification).catch(() => undefined);
      }}
      open={dialog.isOpen}
    />

    <ConfirmDialog
      confirmColor="error"
      confirmLabel="Delete"
      onCancel={cancelDelete}
      onConfirm={() => {
        confirmDelete().catch(() => undefined);
      }}
      open={deleteConfirm.isOpen}
      title="Delete exercise?"
    >
      <DialogContentText>
        Delete &ldquo;{pendingDelete?.name}&rdquo;? Past workout log entries are
        preserved; routine slots referencing it will be cleared.
      </DialogContentText>
    </ConfirmDialog>
  </>
);
