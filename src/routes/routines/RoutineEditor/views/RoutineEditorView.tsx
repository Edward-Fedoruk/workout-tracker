import { DialogActionButtons, FormDialog } from '../../../../components';
import { ExercisePicker } from '../../../exercises/ExercisePicker';
import { ExerciseRow } from '../../ExerciseRow';
import { type UseRoutineEditorReturn } from '../hooks/useRoutineEditor';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';

export type RoutineEditorViewProps = UseRoutineEditorReturn & {
  readonly onBack: () => void;
};

export const RoutineEditorView = ({
  currentRoutineId,
  editingExercise,
  exerciseDialog,
  exerciseErrors,
  exerciseForm,
  handleDeleteExercise,
  handleExerciseSubmit,
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
  routineNameError,
  setExerciseErrors,
  setExerciseForm,
  setRoutineName,
  setRoutineNameError,
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
          sx={{ minHeight: 44, minWidth: 44 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          {currentRoutineId === null ? 'New Routine' : 'Edit Routine'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          error={routineNameError !== null}
          helperText={routineNameError ?? ''}
          label="Routine name"
          onChange={(event) => {
            setRoutineName(event.target.value);
            setRoutineNameError(null);
          }}
          size="small"
          sx={{ flex: 1 }}
          value={routineName}
        />
        <Button
          disabled={isSavingName}
          onClick={() => {
            handleSaveName().catch(() => undefined);
          }}
          variant="contained"
        >
          Save
        </Button>
      </Box>

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

      <FormDialog
        actions={
          <DialogActionButtons
            confirmDisabled={isSubmittingExercise}
            confirmLabel={editingExercise ? 'Save' : 'Add'}
            onCancel={() => {
              exerciseDialog.onClose();
            }}
            onConfirm={() => {
              handleExerciseSubmit().catch(() => undefined);
            }}
          />
        }
        onClose={() => {
          exerciseDialog.onClose();
        }}
        open={exerciseDialog.isOpen}
        title={editingExercise ? 'Edit Exercise' : 'Add Exercise'}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '4px',
          }}
        >
          <ExercisePicker
            error={Boolean(exerciseErrors.name)}
            exercises={libraryExercises}
            helperText={exerciseErrors.name ?? ''}
            label="Exercise"
            onChange={(next) => {
              setExerciseForm((previous) => ({
                ...previous,
                name: next ? next.name : '',
              }));
              setExerciseErrors((previous) => ({ ...previous, name: '' }));
            }}
            value={
              libraryExercises.find(
                (option) => option.name === exerciseForm.name,
              ) ?? null
            }
          />
          <TextField
            error={Boolean(exerciseErrors.sets)}
            helperText={exerciseErrors.sets || '(1–5)'}
            label="Suggested sets"
            onChange={(event) => {
              setExerciseForm((previous) => ({
                ...previous,
                sets: event.target.value,
              }));
              setExerciseErrors((previous) => ({ ...previous, sets: '' }));
            }}
            slotProps={{ htmlInput: { max: 5, min: 1 } }}
            type="number"
            value={exerciseForm.sets}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              error={Boolean(exerciseErrors.minReps)}
              helperText={exerciseErrors.minReps || '(1–99)'}
              label="Min reps"
              onChange={(event) => {
                setExerciseForm((previous) => ({
                  ...previous,
                  minReps: event.target.value,
                }));
                setExerciseErrors((previous) => ({
                  ...previous,
                  minReps: '',
                }));
              }}
              slotProps={{ htmlInput: { max: 99, min: 1 } }}
              sx={{ flex: 1 }}
              type="number"
              value={exerciseForm.minReps}
            />
            <TextField
              error={Boolean(exerciseErrors.maxReps)}
              helperText={exerciseErrors.maxReps || '(1–99)'}
              label="Max reps"
              onChange={(event) => {
                setExerciseForm((previous) => ({
                  ...previous,
                  maxReps: event.target.value,
                }));
                setExerciseErrors((previous) => ({
                  ...previous,
                  maxReps: '',
                }));
              }}
              slotProps={{ htmlInput: { max: 99, min: 1 } }}
              sx={{ flex: 1 }}
              type="number"
              value={exerciseForm.maxReps}
            />
          </Box>
        </Box>
      </FormDialog>
    </Box>
  );
};
