import { type FormValues } from './WorkoutForm.schema';
import { Stack, TextField, Typography } from '@mui/material';
import { type UseFormRegister } from 'react-hook-form';

export type WorkoutSetInputRowProps = {
  readonly index: number;
  readonly isBodyWeight: boolean;
  readonly register: UseFormRegister<FormValues>;
  readonly repsError?: string | undefined;
  readonly weightError?: string | undefined;
  readonly weightInputProps: Record<string, string>;
};

export const WorkoutSetInputRow = ({
  index,
  isBodyWeight,
  register,
  repsError,
  weightError,
  weightInputProps,
}: WorkoutSetInputRowProps) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{ alignItems: 'flex-start', mb: 1 }}
  >
    <Typography
      color="text.secondary"
      sx={{ minWidth: 20, pt: 1.5 }}
    >
      {index + 1}.
    </Typography>
    <TextField
      error={Boolean(weightError)}
      helperText={weightError}
      placeholder="kg"
      size="small"
      slotProps={
        isBodyWeight
          ? undefined
          : { htmlInput: { ...weightInputProps, inputMode: 'decimal' } }
      }
      type={isBodyWeight ? 'text' : 'number'}
      {...register(`sets.${index}.weight`)}
    />
    <TextField
      error={Boolean(repsError)}
      helperText={repsError}
      placeholder="reps"
      size="small"
      slotProps={{ htmlInput: { inputMode: 'numeric', min: '1', step: '1' } }}
      type="number"
      {...register(`sets.${index}.reps`, { valueAsNumber: true })}
    />
  </Stack>
);
