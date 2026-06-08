import { RoutineWorkoutExercise } from './RoutineWorkoutExercise';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  type Exercise,
  type LastExerciseSets,
  type RoutineWithExercises,
  type StoredDraftData,
} from '@/database';
import { useToggle } from '@/hooks/useToggle';
import {
  type FormValues,
  resolver,
} from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Alert, Box, Button, IconButton, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

export type RoutineWorkoutViewProps = {
  readonly bodyWeight: null | number;
  readonly draftData: null | StoredDraftData;
  readonly error: null | string;
  readonly exercises: Exercise[];
  readonly isSubmitting: boolean;
  readonly onAutoSave: (values: FormValues) => void;
  readonly onBack: () => void;
  readonly onDiscard: () => void;
  readonly onSubmit: (values: FormValues) => Promise<void>;
  readonly prefills: Map<number, LastExerciseSets>;
  readonly routine: RoutineWithExercises;
};

export const RoutineWorkoutView = ({
  bodyWeight,
  draftData,
  error,
  exercises,
  isSubmitting,
  onAutoSave,
  onBack,
  onDiscard,
  onSubmit,
  prefills,
  routine,
}: RoutineWorkoutViewProps) => {
  const discardConfirm = useToggle();
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
  } = useForm<FormValues>({
    defaultValues: {
      bodyWeight,
      exercises: routine.exercises.map((routineExercise) => {
        const saved = draftData?.[String(routineExercise.id)];
        return {
          classification:
            exercises.find(
              (option) => option.name === routineExercise.exerciseName,
            )?.classification ?? 'standard',
          exerciseName: routineExercise.exerciseName,
          sets: Array.from(
            { length: routineExercise.suggestedSets },
            (_unused, setIndex) => {
              const savedSet = saved?.[setIndex];
              return {
                reps:
                  savedSet?.reps === null || savedSet === undefined
                    ? Number.NaN
                    : savedSet.reps,
                weight:
                  savedSet?.weight === null || savedSet === undefined
                    ? Number.NaN
                    : savedSet.weight,
              };
            },
          ),
        };
      }),
    },
    resolver,
  });

  // Persist the in-progress form to the draft when the user leaves a field.
  const handleAutoSave = () => {
    onAutoSave(getValues());
  };

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2 }}>
        <IconButton
          aria-label="Go back"
          onClick={onBack}
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
          onAutoSave={handleAutoSave}
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

      <Button
        color="error"
        disabled={isSubmitting}
        fullWidth
        onClick={() => discardConfirm.onOpen()}
        size="large"
        sx={{ mt: 1 }}
        variant="outlined"
      >
        Discard
      </Button>

      <ConfirmDialog
        confirmColor="error"
        confirmLabel="Discard"
        onCancel={() => discardConfirm.onClose()}
        onConfirm={() => {
          discardConfirm.onClose();
          onDiscard();
        }}
        open={discardConfirm.isOpen}
        title="Discard Workout"
      >
        Discard this in-progress workout? Your entered values will be lost.
      </ConfirmDialog>
    </Box>
  );
};
