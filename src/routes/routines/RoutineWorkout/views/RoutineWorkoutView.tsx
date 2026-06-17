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
import { useNavigate } from 'react-router-dom';

export type RoutineWorkoutViewProps = {
  readonly bodyWeight: null | number;
  readonly draftData: null | StoredDraftData;
  readonly error: null | string;
  readonly exerciseImageMap: Map<string, string | undefined>;
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
  exerciseImageMap,
  exercises,
  isSubmitting,
  onAutoSave,
  onBack,
  onDiscard,
  onSubmit,
  prefills,
  routine,
}: RoutineWorkoutViewProps) => {
  const navigate = useNavigate();
  const discardConfirm = useToggle();
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      bodyWeight,
      exercises: routine.exercises.map((routineExercise) => {
        const saved = draftData?.[String(routineExercise.id)];
        const prefill = prefills.get(routineExercise.id);
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
              const prefillEntry = prefill?.[setIndex];
              const hasNoSaved =
                savedSet === undefined ||
                (savedSet.reps === null && savedSet.weight === null);
              return {
                completed: savedSet?.completed ?? false,
                reps:
                  savedSet?.reps !== null && savedSet?.reps !== undefined
                    ? savedSet.reps
                    : hasNoSaved && prefillEntry !== undefined
                      ? prefillEntry.reps
                      : Number.NaN,
                weight:
                  savedSet?.weight !== null && savedSet?.weight !== undefined
                    ? savedSet.weight
                    : hasNoSaved &&
                        prefillEntry?.weight !== null &&
                        prefillEntry !== undefined
                      ? prefillEntry.weight
                      : '',
              };
            },
          ),
        };
      }),
    },
    mode: "onBlur",
    resolver,
  });

  const exercisesValues = watch('exercises');
  const allSetsCompleted =
    exercisesValues.length > 0 &&
    exercisesValues.every((ex) =>
      ex.sets.every((set) => set.completed === true),
    );

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

      {routine.exercises.map((routineExercise, exerciseIndex) => {
        const classification = exercises.find(
              (option) => option.name === routineExercise.exerciseName,
            )?.classification ?? 'standard';
        const found = exercises.find(
          (library) => library.name === routineExercise.exerciseName,
        );
        return (
          <RoutineWorkoutExercise
            errors={errors}
            exercise={routineExercise}
            classification={classification}
            exerciseIndex={exerciseIndex}
            imageFilename={exerciseImageMap.get(routineExercise.exerciseName)}
            key={routineExercise.id}
            onAutoSave={handleAutoSave}
            prefill={prefills.get(routineExercise.id) ?? []}
            register={register}
            watch={watch}
            {...(found !== undefined && {
              onNavigateToExercise: () => navigate(`/exercises/${found.id}`),
            })}
          />
        );
      })}

      <Button
        disabled={isSubmitting || !allSetsCompleted}
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
