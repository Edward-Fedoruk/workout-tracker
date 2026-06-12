import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExerciseRow } from '@/routes/routines/ExerciseRow';
import { type UseRoutineEditorReturn } from '@/routes/routines/RoutineEditor/hooks/useRoutineEditor';
import { RoutineExerciseForm } from '@/routes/routines/RoutineExerciseForm';
import { RoutineNameForm } from '@/routes/routines/RoutineNameForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type RoutineEditorViewProps = UseRoutineEditorReturn & {
  readonly onBack: () => void;
};

export const RoutineEditorView = ({
  cancelDelete,
  closeEditName,
  currentRoutineId,
  deleteConfirm,
  editingExercise,
  editNameDialog,
  exerciseDialog,
  handleConfirmDelete,
  handleDeleteExercise,
  handleExerciseSave,
  handleMove,
  handleSaveName,
  isLoading,
  isSavingName,
  isSubmittingExercise,
  libraryExercises,
  onBack,
  openAddExercise,
  openEditExercise,
  openEditName,
  requestDelete,
  routine,
  routineName,
}: RoutineEditorViewProps) => {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const exercises = routine?.exercises ?? [];

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2 }}>
        <IconButton
          aria-label="Go back"
          onClick={onBack}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          sx={{ flex: 1 }}
          variant="h5"
        >
          {currentRoutineId === null ? 'New Routine' : 'Edit Routine'}
        </Typography>
        {currentRoutineId !== null && (
          <IconButton
            aria-label="more options"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
        )}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        open={Boolean(menuAnchor)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            openEditName();
          }}
        >
          Edit name
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            requestDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      <RoutineNameForm
        isSaving={isSavingName}
        onSave={handleSaveName}
        value={routineName}
      />

      <Typography
        sx={{ mb: 1 }}
        variant="h6"
      >
        Exercises
      </Typography>

      {exercises.length === 0 ? (
        <Typography
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          No exercises yet.
        </Typography>
      ) : (
        exercises.map((exercise, index) => {
          const found = libraryExercises.find(
            (library) => library.name === exercise.exerciseName,
          );
          return (
            <ExerciseRow
              exercise={exercise}
              isFirst={index === 0}
              isLast={index === exercises.length - 1}
              key={exercise.id}
              onDelete={() => {
                handleDeleteExercise(exercise).catch(() => undefined);
              }}
              onEdit={() => openEditExercise(exercise)}
              onMoveDown={() => {
                handleMove(exercise, 'down').catch(() => undefined);
              }}
              onMoveUp={() => {
                handleMove(exercise, 'up').catch(() => undefined);
              }}
              {...(found !== undefined && {
                onNavigateToExercise: () => navigate(`/exercises/${found.id}`),
              })}
            />
          );
        })
      )}

      <Button
        disabled={currentRoutineId === null}
        onClick={openAddExercise}
        sx={{ mt: 2 }}
        variant="outlined"
      >
        Add Exercise
      </Button>

      <RoutineExerciseForm
        initialValues={
          editingExercise
            ? {
                maxReps: editingExercise.maxReps,
                minReps: editingExercise.minReps,
                name: editingExercise.exerciseName,
                sets: editingExercise.suggestedSets,
              }
            : undefined
        }
        isSubmitting={isSubmittingExercise}
        libraryExercises={libraryExercises}
        mode={editingExercise ? 'edit' : 'create'}
        onCancel={() => {
          exerciseDialog.onClose();
        }}
        onSave={handleExerciseSave}
        open={exerciseDialog.isOpen}
      />

      <ConfirmDialog
        confirmColor="error"
        confirmLabel="Delete"
        onCancel={cancelDelete}
        onConfirm={() => {
          handleConfirmDelete().catch(() => undefined);
        }}
        open={deleteConfirm.isOpen}
        title="Delete Routine"
      >
        Delete this routine? This cannot be undone.
      </ConfirmDialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={closeEditName}
        open={editNameDialog.isOpen}
      >
        <DialogTitle>Edit name</DialogTitle>
        <DialogContent>
          <RoutineNameForm
            isSaving={isSavingName}
            onSave={async (values) => {
              await handleSaveName(values);
              closeEditName();
            }}
            value={routineName}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
