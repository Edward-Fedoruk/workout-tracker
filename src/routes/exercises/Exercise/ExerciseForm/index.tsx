import { type FormValues, resolver } from './schema';
import { DialogActionButtons, FormDialog } from '@/components';
import { type MuscleGroup } from '@/database';
import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

export type ExerciseFormInitial = FormValues;

export type ExerciseFormProps = {
  readonly initialValues?: ExerciseFormInitial | undefined;
  readonly mode: 'create' | 'edit';
  readonly muscleGroups: MuscleGroup[];
  readonly onCancel: () => void;
  readonly onSave: (values: FormValues) => Promise<null | string>;
  readonly open: boolean;
};

const EMPTY_VALUES: FormValues = {
  classification: 'standard',
  muscleGroupIds: [],
  name: '',
};

export const ExerciseForm = ({
  initialValues,
  mode,
  muscleGroups,
  onCancel,
  onSave,
  open,
}: ExerciseFormProps) => {
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
    const duplicateMessage = await onSave(values);
    if (duplicateMessage) {
      setError('name', { message: duplicateMessage });
    }
  });

  return (
    <FormDialog
      actions={
        <DialogActionButtons
          confirmLabel={mode === 'create' ? 'Add' : 'Save'}
          onCancel={onCancel}
          onConfirm={() => {
            submit().catch(() => undefined);
          }}
        />
      }
      onClose={onCancel}
      open={open}
      title={mode === 'create' ? 'Add Exercise' : 'Edit Exercise'}
    >
      <Stack
        spacing={2}
        sx={{ pt: '4px' }}
      >
        <TextField
          autoFocus
          error={Boolean(errors.name)}
          fullWidth
          helperText={errors.name?.message ?? ''}
          label="Exercise name"
          {...register('name')}
        />
        <Controller
          control={control}
          name="muscleGroupIds"
          render={({ field }) => (
            <Autocomplete
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              multiple
              onChange={(_event, next) => {
                field.onChange(next.map((group) => group.id));
              }}
              options={muscleGroups}
              renderInput={(parameters) => (
                <TextField
                  {...parameters}
                  error={Boolean(errors.muscleGroupIds)}
                  helperText={errors.muscleGroupIds?.message ?? ''}
                  label="Muscle groups"
                />
              )}
              value={muscleGroups.filter((group) =>
                field.value.includes(group.id),
              )}
            />
          )}
        />
        <Controller
          control={control}
          name="classification"
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="exercise-classification-label">
                Classification
              </InputLabel>
              <Select
                label="Classification"
                labelId="exercise-classification-label"
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                value={field.value}
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="bodyweight">Body weight</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Stack>
    </FormDialog>
  );
};
