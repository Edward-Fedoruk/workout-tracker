import { type Exercise } from '@/database';
import { Autocomplete, TextField } from '@mui/material';

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
}: ExercisePickerProps) => {
  return (
    <Autocomplete
      disabled={disabled}
      filterOptions={(options, state) => {
        const query = state.inputValue.trim().toLowerCase();
        if (!query) {
          return options;
        }

        return options.filter((option) =>
          option.name.toLowerCase().includes(query),
        );
      }}
      freeSolo={false}
      fullWidth
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      onChange={(_event, next) => {
        onChange(next);
      }}
      options={exercises}
      renderInput={(parameters) => (
        <TextField
          {...parameters}
          error={error}
          helperText={helperText}
          label={label}
          sx={{
            '& .MuiInputBase-root': { minHeight: 44 },
          }}
        />
      )}
      value={value}
    />
  );
};
