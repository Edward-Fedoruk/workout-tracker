import {
  type Exercise,
  type LastExerciseSets,
  type RoutineWithExercises,
} from '../../../../database';
import { type FormValues, resolver } from '../RoutineWorkoutForm.schema';
import { RoutineWorkoutExercise } from './RoutineWorkoutExercise';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Alert, Box, Button, IconButton, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

export type RoutineWorkoutViewProps = {
  readonly bodyWeight: null | number;
  readonly error: null | string;
  readonly exercises: Exercise[];
  readonly isSubmitting: boolean;
  readonly onBack: () => void;
  readonly onSubmit: (values: FormValues) => Promise<void>;
  readonly prefills: Map<number, LastExerciseSets>;
  readonly routine: RoutineWithExercises;
};

export const RoutineWorkoutView = ({
  bodyWeight,
  error,
  exercises,
  isSubmitting,
  onBack,
  onSubmit,
  prefills,
  routine,
}: RoutineWorkoutViewProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormValues>({
    defaultValues: {
      bodyWeight,
      exercises: routine.exercises.map((routineExercise) => ({
        classification:
          exercises.find(
            (option) => option.name === routineExercise.exerciseName,
          )?.classification ?? 'standard',
        exerciseName: routineExercise.exerciseName,
        sets: Array.from({ length: routineExercise.suggestedSets }, () => ({
          reps: Number.NaN,
          weight: Number.NaN,
        })),
      })),
    },
    resolver,
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

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

      {error !== null && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {routine.exercises.map((routineExercise, exerciseIndex) => (
        <RoutineWorkoutExercise
          errors={errors}
          exercise={routineExercise}
          exerciseIndex={exerciseIndex}
          key={routineExercise.id}
          prefill={prefills.get(routineExercise.id) ?? []}
          register={register}
        />
      ))}

      <Button
        disabled={isSubmitting}
        fullWidth
        onClick={() => {
          submit().catch(() => undefined);
        }}
        size="large"
        sx={{ mt: 2 }}
        variant="contained"
      >
        {isSubmitting ? 'Saving…' : 'Log Workout'}
      </Button>
    </Box>
  );
};
