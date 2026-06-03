import { ConfirmDialog } from '@/components/ConfirmDialog';
import { type MuscleGroup } from '@/database';
import { ExerciseForm } from '@/routes/exercises/Exercise/ExerciseForm';
import { ExerciseList } from '@/routes/exercises/Exercise/ExerciseList';
import { type UseExercisesReturn } from '@/routes/exercises/ExerciseLibrary/hooks/useExercises';
import AddIcon from '@mui/icons-material/Add';
import { Button, DialogContentText, Stack } from '@mui/material';

export type ExercisesSubViewProps = UseExercisesReturn & {
  readonly muscleGroups: MuscleGroup[];
};

export const ExercisesSubView = ({
  cancelDelete,
  confirmDelete,
  deleteConfirm,
  dialog,
  dialogMode,
  editingExercise,
  exercises,
  handleSave,
  muscleGroups,
  openCreate,
  openEdit,
  pendingDelete,
  requestDelete,
}: ExercisesSubViewProps) => (
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
      onSave={handleSave}
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
