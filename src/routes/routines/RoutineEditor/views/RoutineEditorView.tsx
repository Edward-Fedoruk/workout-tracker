import { ExerciseRow } from '@/routes/routines/ExerciseRow';
import { type UseRoutineEditorReturn } from '@/routes/routines/RoutineEditor/hooks/useRoutineEditor';
import { RoutineExerciseForm } from '@/routes/routines/RoutineExerciseForm';
import { RoutineNameForm } from '@/routes/routines/RoutineNameForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';

export type RoutineEditorViewProps = UseRoutineEditorReturn & {
  readonly onBack: () => void;
};

export const RoutineEditorView = ({
  currentRoutineId,
  editingExercise,
  exerciseDialog,
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
  routine,
  routineName,
}: RoutineEditorViewProps) => {
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
        <Typography variant="h5">
          {currentRoutineId === null ? 'New Routine' : 'Edit Routine'}
        </Typography>
      </Box>

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
        exercises.map((exercise, index) => (
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
          />
        ))
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
    </Box>
  );
};
