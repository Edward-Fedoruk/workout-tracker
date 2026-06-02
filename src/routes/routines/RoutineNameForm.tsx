import { type FormValues, resolver } from './RoutineNameForm.schema';
import { Box, Button, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export type RoutineNameFormProps = {
  readonly isSaving: boolean;
  readonly onSave: (values: FormValues) => Promise<void>;
  readonly value: string;
};

export const RoutineNameForm = ({
  isSaving,
  onSave,
  value,
}: RoutineNameFormProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<FormValues>({
    defaultValues: { name: '' },
    resolver,
  });

  useEffect(() => {
    reset({ name: value });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync the loaded/saved name into the field
  }, [value]);

  const submit = handleSubmit(async (values) => {
    await onSave(values);
  });

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
      <TextField
        error={Boolean(errors.name)}
        helperText={errors.name?.message ?? ''}
        label="Routine name"
        size="small"
        sx={{ flex: 1 }}
        {...register('name')}
      />
      <Button
        disabled={isSaving}
        onClick={() => {
          submit().catch(() => undefined);
        }}
        variant="contained"
      >
        Save
      </Button>
    </Box>
  );
};
