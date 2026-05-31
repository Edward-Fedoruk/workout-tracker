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

type Props = {
  readonly onBack: () => void;
  readonly routineId: number;
};

type SetValue = { reps: string; weight: string };

export const RoutineWorkoutForm = ({ onBack, routineId }: Props) => {
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
    const init = async () => {
      const [data, bw, exList] = await Promise.all([
        getRoutineById(routineId),
        getBodyWeight(),
        listExercises(),
      ]);

      if (!data) {
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

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    init().catch(() => setLoading(false));
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

      onBack();
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
    return (
      <Box sx={{ padding: 2 }}>
        <Typography>Routine not found.</Typography>
        <Button onClick={onBack}>Back</Button>
      </Box>
    );
  }

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
        // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync event handler
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
