import {
  createWorkout,
  type Exercise,
  getBodyWeight,
  getLastExerciseSets,
  getRoutineById,
  type LastExerciseSets,
  listExercises,
  type RoutineExercise,
  type RoutineWithExercises,
} from '../../database';
import { computeEffectiveWeight, computeERM } from '../../utils/erm';
import { RoutineWorkoutExercise } from './RoutineWorkoutExercise';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type SetValue = { reps: string; weight: string };

export const RoutineWorkoutForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routineId = id === undefined ? Number.NaN : Number.parseInt(id, 10);
  const [routine, setRoutine] = useState<null | RoutineWithExercises>(null);
  const [prefills, setPrefills] = useState<Map<number, LastExerciseSets>>(
    new Map(),
  );
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeight, setBodyWeight] = useState<null | number>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const exerciseSets = useRef<Map<number, SetValue[]>>(new Map());

  useEffect(() => {
    if (Number.isNaN(routineId)) {
      navigate('/routines', { replace: true });
      return;
    }

    const init = async () => {
      const [data, bw, exList] = await Promise.all([
        getRoutineById(routineId),
        getBodyWeight(),
        listExercises(),
      ]);

      if (!data) {
        navigate('/routines', { replace: true });
        return;
      }

      setRoutine(data);
      setBodyWeight(bw);
      setExercises(exList);

      const prefillMap = new Map<number, LastExerciseSets>();
      await Promise.all(
        data.exercises.map(async (exercise: RoutineExercise) => {
          const sets = await getLastExerciseSets(
            exercise.exerciseName,
            exercise.suggestedSets,
          );
          prefillMap.set(exercise.id, sets);
        }),
      );
      setPrefills(prefillMap);
      setLoading(false);
    };

    init().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate is stable; routineId is the real dependency
  }, [routineId]);

  const handleChange = (exerciseId: number, sets: SetValue[]) => {
    exerciseSets.current.set(exerciseId, sets);
  };

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = async () => {
    if (!routine) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      for (const exercise of routine.exercises) {
        const sets = exerciseSets.current.get(exercise.id) ?? [];
        const classification =
          exercises.find((ex) => ex.name === exercise.exerciseName)
            ?.classification ?? 'standard';

        const filledSets = sets
          .filter(
            (setEntry) => setEntry.reps !== '' && Number(setEntry.reps) > 0,
          )
          .filter((setEntry) => {
            if (classification === 'standard') {
              return setEntry.weight !== '' && Number(setEntry.weight) > 0;
            }

            if (setEntry.weight === '' || Number(setEntry.weight) === 0) {
              return bodyWeight !== null;
            }

            return true;
          })
          .map((setEntry) => {
            const weight =
              setEntry.weight.trim() === '' ? null : Number(setEntry.weight);
            const reps = Number(setEntry.reps);
            const effective = computeEffectiveWeight({
              bodyWeight,
              classification,
              loggedWeight: weight,
            });
            const erm = effective === null ? null : computeERM(effective, reps);
            return { erm, reps, weight };
          });

        if (filledSets.length > 0) {
          await createWorkout(today, exercise.exerciseName, filledSets);
        }
      }

      navigate('/log');
    } catch {
      setError('Failed to save workout. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!routine) {
    return null;
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2 }}>
        <IconButton
          aria-label="Go back"
          onClick={() => navigate('/routines')}
          sx={{ minHeight: 44, minWidth: 44 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">{routine.name}</Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {routine.exercises.map((exercise) => (
        <RoutineWorkoutExercise
          exercise={exercise}
          key={exercise.id}
          onChange={(sets) => handleChange(exercise.id, sets)}
          prefill={prefills.get(exercise.id) ?? []}
        />
      ))}

      <Button
        disabled={submitting}
        fullWidth
        onClick={() => handleSubmit().catch(() => undefined)}
        size="large"
        sx={{ mt: 2 }}
        variant="contained"
      >
        {submitting ? 'Saving…' : 'Log Workout'}
      </Button>
    </Box>
  );
};
