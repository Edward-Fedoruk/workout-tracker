import { type FormValues, resolver } from './RoutineExerciseForm.schema';
import { DialogActionButtons, FormDialog } from '@/components';
import { type Exercise } from '@/database';
import { ExercisePicker } from '@/routes/exercises/Exercise/ExercisePicker';
import { Box, TextField } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

export type RoutineExerciseFormProps = {
  readonly initialValues?: FormValues | undefined;
  readonly isSubmitting: boolean;
  readonly libraryExercises: Exercise[];
  readonly mode: 'create' | 'edit';
  readonly onCancel: () => void;
  readonly onSave: (values: FormValues) => Promise<null | string>;
  readonly open: boolean;
};

const EMPTY_VALUES: FormValues = {
  maxReps: 12,
  minReps: 8,
  name: '',
  sets: 3,
};

export const RoutineExerciseForm = ({
  initialValues,
  isSubmitting,
  libraryExercises,
  mode,
  onCancel,
  onSave,
  open,
}: RoutineExerciseFormProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<FormValues>({
    defaultValues: EMPTY_VALUES,
    resolver,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? EMPTY_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form only when the dialog opens
  }, [open]);

  const submit = handleSubmit(async (values) => {
    const errorMessage = await onSave(values);
    if (errorMessage) {
      setError('name', { message: errorMessage });
    }
  });

  return (
    <FormDialog
      actions={
        <DialogActionButtons
          confirmDisabled={isSubmitting}
          confirmLabel={mode === 'edit' ? 'Save' : 'Add'}
          onCancel={onCancel}
          onConfirm={() => {
            submit().catch(() => undefined);
          }}
        />
      }
      onClose={onCancel}
      open={open}
      title={mode === 'edit' ? 'Edit Exercise' : 'Add Exercise'}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: '4px',
        }}
      >
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <ExercisePicker
              error={Boolean(errors.name)}
              exercises={libraryExercises}
              helperText={errors.name?.message ?? ''}
              label="Exercise"
              onChange={(next) => {
                field.onChange(next ? next.name : '');
              }}
              value={
                libraryExercises.find(
                  (option) => option.name === field.value,
                ) ?? null
              }
            />
          )}
        />
        <TextField
          error={Boolean(errors.sets)}
          helperText={errors.sets?.message ?? '(1–5)'}
          label="Suggested sets"
          slotProps={{ htmlInput: { inputMode: 'numeric', max: 5, min: 1 } }}
          type="number"
          {...register('sets', { valueAsNumber: true })}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            error={Boolean(errors.minReps)}
            helperText={errors.minReps?.message ?? '(1–99)'}
            label="Min reps"
            slotProps={{ htmlInput: { inputMode: 'numeric', max: 99, min: 1 } }}
            sx={{ flex: 1 }}
            type="number"
            {...register('minReps', { valueAsNumber: true })}
          />
          <TextField
            error={Boolean(errors.maxReps)}
            helperText={errors.maxReps?.message ?? '(1–99)'}
            label="Max reps"
            slotProps={{ htmlInput: { inputMode: 'numeric', max: 99, min: 1 } }}
            sx={{ flex: 1 }}
            type="number"
            {...register('maxReps', { valueAsNumber: true })}
          />
        </Box>
      </Box>
    </FormDialog>
  );
};
