import {
  addRoutineExercise,
  createRoutine,
  deleteRoutineExercise,
  type Exercise,
  getRoutineById,
  listExercises,
  moveRoutineExercise,
  type RoutineExercise,
  type RoutineWithExercises,
  updateRoutine,
  updateRoutineExercise,
} from '../../database';
import { ExercisePicker } from '../exercises/ExercisePicker';
import { ExerciseRow } from './ExerciseRow';
import { validateExercise, validateRoutineName } from './routineUtilities';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

type ExerciseErrors = {
  maxReps?: string;
  minReps?: string;
  name?: string;
  sets?: string;
};

type ExerciseFormState = {
  maxReps: string;
  minReps: string;
  name: string;
  sets: string;
};

type Props = {
  readonly onBack: () => void;
  readonly routineId: null | number;
};

export const RoutineEditor = ({ onBack, routineId }: Props) => {
  const [routine, setRoutine] = useState<null | RoutineWithExercises>(null);
  const [loading, setLoading] = useState(true);
  const [routineName, setRoutineName] = useState('');
  const [routineNameError, setRoutineNameError] = useState<null | string>(null);
  const [savingName, setSavingName] = useState(false);

  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<null | RoutineExercise>(null);
  const [exerciseForm, setExerciseForm] = useState<ExerciseFormState>({
    maxReps: '12',
    minReps: '8',
    name: '',
    sets: '3',
  });
  const [exerciseErrors, setExerciseErrors] = useState<ExerciseErrors>({});
  const [submittingExercise, setSubmittingExercise] = useState(false);

  const [currentRoutineId, setCurrentRoutineId] = useState<null | number>(
    routineId,
  );

  const [libraryExercises, setLibraryExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const loadLibrary = async () => {
      setLibraryExercises(await listExercises());
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    loadLibrary().catch(() => undefined);
  }, []);

  const load = async (id: number) => {
    const data = await getRoutineById(id);
    if (data) {
      setRoutine(data);
      setRoutineName(data.name);
    }

    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      if (currentRoutineId === null) {
        setRoutineName('');
        setLoading(false);
        return;
      }

      await load(currentRoutineId);
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    initialize().catch(() => undefined);
  }, [currentRoutineId]);

  const handleSaveName = async () => {
    const nameError = validateRoutineName(routineName);
    if (nameError) {
      setRoutineNameError(nameError);
      return;
    }

    setSavingName(true);
    if (currentRoutineId === null) {
      const newId = await createRoutine(routineName.trim());
      setCurrentRoutineId(newId);
      await load(newId);
    } else {
      await updateRoutine(currentRoutineId, routineName.trim());
      await load(currentRoutineId);
    }

    setSavingName(false);
  };

  const openAddExercise = () => {
    setEditingExercise(null);
    setExerciseForm({ maxReps: '12', minReps: '8', name: '', sets: '3' });
    setExerciseErrors({});
    setExerciseDialogOpen(true);
  };

  const openEditExercise = (exercise: RoutineExercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      maxReps: String(exercise.maxReps),
      minReps: String(exercise.minReps),
      name: exercise.exerciseName,
      sets: String(exercise.suggestedSets),
    });
    setExerciseErrors({});
    setExerciseDialogOpen(true);
  };

  const handleExerciseSubmit = async () => {
    const setsNumber = Number.parseInt(exerciseForm.sets, 10);
    const minRepsNumber = Number.parseInt(exerciseForm.minReps, 10);
    const maxRepsNumber = Number.parseInt(exerciseForm.maxReps, 10);
    const errors = validateExercise(
      exerciseForm.name,
      setsNumber,
      minRepsNumber,
      maxRepsNumber,
    );
    if (Object.keys(errors).length > 0) {
      setExerciseErrors(errors);
      return;
    }

    if (currentRoutineId === null) {
      setExerciseErrors({ name: 'Save the routine name first' });
      return;
    }

    setSubmittingExercise(true);
    if (editingExercise) {
      await updateRoutineExercise(
        editingExercise.id,
        exerciseForm.name.trim(),
        setsNumber,
        minRepsNumber,
        maxRepsNumber,
      );
    } else {
      await addRoutineExercise(
        currentRoutineId,
        exerciseForm.name.trim(),
        setsNumber,
        minRepsNumber,
        maxRepsNumber,
      );
    }

    setSubmittingExercise(false);
    setExerciseDialogOpen(false);
    await load(currentRoutineId);
  };

  const handleDeleteExercise = async (exercise: RoutineExercise) => {
    if (currentRoutineId === null) {
      return;
    }

    await deleteRoutineExercise(exercise.id, currentRoutineId);
    await load(currentRoutineId);
  };

  const handleMove = async (
    exercise: RoutineExercise,
    direction: 'down' | 'up',
  ) => {
    if (currentRoutineId === null) {
      return;
    }

    await moveRoutineExercise(exercise.id, currentRoutineId, direction);
    await load(currentRoutineId);
  };

  if (loading) {
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
          disabled={savingName}
          // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync event handler
          onClick={() => handleSaveName().catch(() => undefined)}
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
              // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync event handler
              handleDeleteExercise(exercise).catch(() => undefined);
            }}
            onEdit={() => openEditExercise(exercise)}
            onMoveDown={() => {
              // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync event handler
              handleMove(exercise, 'down').catch(() => undefined);
            }}
            onMoveUp={() => {
              // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync event handler
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

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setExerciseDialogOpen(false)}
        open={exerciseDialogOpen}
      >
        <DialogTitle>
          {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '16px !important',
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
                setExerciseErrors((previous) => ({ ...previous, minReps: '' }));
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
                setExerciseErrors((previous) => ({ ...previous, maxReps: '' }));
              }}
              slotProps={{ htmlInput: { max: 99, min: 1 } }}
              sx={{ flex: 1 }}
              type="number"
              value={exerciseForm.maxReps}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExerciseDialogOpen(false)}>Cancel</Button>
          <Button
            disabled={submittingExercise}
            // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync event handler
            onClick={() => handleExerciseSubmit().catch(() => undefined)}
            variant="contained"
          >
            {editingExercise ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
