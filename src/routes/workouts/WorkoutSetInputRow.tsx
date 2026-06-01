import { type SetErrors } from './workoutFormUtilities';
import { Stack, TextField, Typography } from '@mui/material';

export type WorkoutSetInputRowProps = {
  readonly errors: SetErrors | undefined;
  readonly index: number;
  readonly onChange: (field: 'reps' | 'weight', value: string) => void;
  readonly reps: string;
  readonly weight: string;
  readonly weightInputProps: Record<string, string>;
};

export const WorkoutSetInputRow = ({
  errors,
  index,
  onChange,
  reps,
  weight,
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
      error={Boolean(errors?.weight)}
      helperText={errors?.weight}
      onChange={(event) => onChange('weight', event.target.value)}
      placeholder="kg"
      size="small"
      slotProps={{ htmlInput: weightInputProps }}
      type="number"
      value={weight}
    />
    <TextField
      error={Boolean(errors?.reps)}
      helperText={errors?.reps}
      onChange={(event) => onChange('reps', event.target.value)}
      placeholder="reps"
      size="small"
      slotProps={{ htmlInput: { min: '1', step: '1' } }}
      type="number"
      value={reps}
    />
  </Stack>
);
