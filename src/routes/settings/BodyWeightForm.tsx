import { type FormValues, resolver } from './BodyWeightForm.schema';
import { type Feedback } from './hooks/useBodyWeight';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export type BodyWeightFormProps = {
  readonly feedback: Feedback | null;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly onClearFeedback: () => void;
  readonly onSave: (values: FormValues) => Promise<void>;
  readonly value: null | number;
};

export const BodyWeightForm = ({
  feedback,
  isLoading,
  isSaving,
  onClearFeedback,
  onSave,
  value,
}: BodyWeightFormProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<FormValues>({
    defaultValues: { bodyWeight: Number.NaN },
    resolver,
  });

  useEffect(() => {
    reset({ bodyWeight: value ?? Number.NaN });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync the loaded/saved value into the field
  }, [value]);

  const submit = handleSubmit(async (values) => {
    await onSave(values);
  });

  const bodyWeightField = register('bodyWeight', {
    onChange: () => {
      onClearFeedback();
    },
    valueAsNumber: true,
  });

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Body weight</Typography>
      <TextField
        disabled={isLoading || isSaving}
        error={Boolean(errors.bodyWeight)}
        fullWidth
        helperText={
          errors.bodyWeight?.message ??
          'Used to compute eRM for body-weight and assisted exercises.'
        }
        label="Body weight (kg)"
        slotProps={{
          htmlInput: { inputMode: 'decimal', min: '0.01', step: '0.01' },
        }}
        type="number"
        {...bodyWeightField}
      />

      {feedback !== null && (
        <Alert severity={feedback.severity}>{feedback.message}</Alert>
      )}

      <Box>
        <Button
          disabled={isLoading || isSaving}
          onClick={() => {
            submit().catch(() => undefined);
          }}
          sx={{ minWidth: 96 }}
          variant="contained"
        >
          Save
        </Button>
      </Box>
    </Stack>
  );
};
