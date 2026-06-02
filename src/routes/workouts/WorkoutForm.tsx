import { type Exercise, type WorkoutWithSets } from '../../database';
import { ExercisePicker } from '../exercises/ExercisePicker';
import { type FormValues, resolver } from './WorkoutForm.schema';
import { getToday, getWeightInputMin } from './workoutFormUtilities';
import { WorkoutSetInputRow } from './WorkoutSetInputRow';
import {
  Box,
  Button,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

export type WorkoutFormProps = {
  readonly bodyWeight: null | number;
  readonly exercises: Exercise[];
  readonly initialData?: undefined | WorkoutWithSets;
  readonly onCancel: () => void;
  readonly onSave: (values: FormValues) => Promise<null | string>;
};

export const WorkoutForm = ({
  bodyWeight,
  exercises,
  initialData,
  onCancel,
  onSave,
}: WorkoutFormProps) => {
  const isEditing = initialData !== undefined;
  const defaultExerciseName = initialData?.exerciseName ?? '';
  const defaultClassification =
    exercises.find((option) => option.name === defaultExerciseName)
      ?.classification ?? 'standard';

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      bodyWeight,
      classification: defaultClassification,
      exerciseName: defaultExerciseName,
      sets:
        initialData && initialData.sets.length > 0
          ? initialData.sets.map((workoutSet) => ({
              reps: workoutSet.reps,
              weight:
                workoutSet.weight === null ? Number.NaN : workoutSet.weight,
            }))
          : [{ reps: Number.NaN, weight: Number.NaN }],
      workoutDate: initialData?.workoutDate ?? getToday(),
    },
    resolver,
  });

  const { append, fields, remove } = useFieldArray({ control, name: 'sets' });

  const classification = watch('classification');
  const weightMin = getWeightInputMin(classification);
  const weightInputProps =
    weightMin === undefined ? { step: '0.1' } : { min: weightMin, step: '0.1' };

  const submit = handleSubmit(async (values) => {
    const message = await onSave(values);
    if (message) {
      setError('root', { message });
    }
  });

  const addSet = () => {
    if (fields.length < 5) {
      append({ reps: Number.NaN, weight: Number.NaN });
    }
  };

  const removeLastSet = () => {
    if (fields.length > 1) {
      remove(fields.length - 1);
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        error={Boolean(errors.workoutDate)}
        fullWidth
        helperText={errors.workoutDate?.message ?? ''}
        label="Date"
        slotProps={{ htmlInput: { max: getToday() } }}
        type="date"
        {...register('workoutDate')}
      />

      <Controller
        control={control}
        name="exerciseName"
        render={({ field }) => (
          <ExercisePicker
            error={Boolean(errors.exerciseName)}
            exercises={exercises}
            helperText={errors.exerciseName?.message ?? ''}
            onChange={(next) => {
              field.onChange(next ? next.name : '');
              setValue(
                'classification',
                next ? next.classification : 'standard',
              );
            }}
            value={
              exercises.find((option) => option.name === field.value) ?? null
            }
          />
        )}
      />

      <Box>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Sets</Typography>
        {fields.map((field, index) => (
          <WorkoutSetInputRow
            index={index}
            key={field.id}
            register={register}
            repsError={errors.sets?.[index]?.reps?.message}
            weightError={errors.sets?.[index]?.weight?.message}
            weightInputProps={weightInputProps}
          />
        ))}

        {errors.sets?.root && (
          <FormHelperText
            error
            sx={{ mb: 1 }}
          >
            {errors.sets.root.message}
          </FormHelperText>
        )}

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1 }}
        >
          <Button
            disabled={fields.length >= 5}
            onClick={addSet}
            size="small"
            variant="outlined"
          >
            + Add Set
          </Button>
          {fields.length > 1 && (
            <Button
              onClick={removeLastSet}
              size="small"
            >
              − Remove Last Set
            </Button>
          )}
        </Stack>
      </Box>

      {errors.root && (
        <Typography color="error">{errors.root.message}</Typography>
      )}

      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'flex-end' }}
      >
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          disabled={isSubmitting}
          onClick={() => {
            submit().catch(() => undefined);
          }}
          variant="contained"
        >
          {isEditing ? 'Update Workout' : 'Save Workout'}
        </Button>
      </Stack>
    </Stack>
  );
};
