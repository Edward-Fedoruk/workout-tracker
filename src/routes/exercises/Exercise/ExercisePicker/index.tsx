import { type Exercise } from '@/database';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';

export type ExercisePickerProps = {
  readonly disabled?: boolean | undefined;
  readonly error?: boolean | undefined;
  readonly exercises: Exercise[];
  readonly helperText?: string | undefined;
  readonly label?: string | undefined;
  readonly onChange: (exercise: Exercise | null) => void;
  readonly value: Exercise | null;
};

export const ExercisePicker = ({
  disabled,
  error,
  exercises,
  helperText,
  label = 'Exercise',
  onChange,
  value,
}: ExercisePickerProps) => (
  <FormControl
    disabled={disabled}
    error={error}
    fullWidth
  >
    <InputLabel>{label}</InputLabel>
    <Select
      label={label}
      onChange={(event) => {
        const selected =
          exercises.find((exercise) => exercise.name === event.target.value) ??
          null;
        onChange(selected);
      }}
      value={value?.name ?? ''}
    >
      {exercises.map((exercise) => (
        <MenuItem
          key={exercise.id}
          value={exercise.name}
        >
          {exercise.name}
        </MenuItem>
      ))}
    </Select>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);
