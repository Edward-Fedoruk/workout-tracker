import { type LastExerciseSets } from '@/database';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import Looks3Icon from '@mui/icons-material/Looks3';
import Looks4Icon from '@mui/icons-material/Looks4';
import Looks5Icon from '@mui/icons-material/Looks5';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import { Box, Checkbox, TextField } from '@mui/material';
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
} from 'react-hook-form';

const LOOKS_ICONS = [
  LooksOneIcon,
  LooksTwoIcon,
  Looks3Icon,
  Looks4Icon,
  Looks5Icon,
] as const;

export type RoutineWorkoutSetRowProps = {
  readonly errors: FieldErrors<FormValues>;
  readonly exerciseIndex: number;
  readonly isBodyWeight: boolean;
  readonly onAutoSave: () => void;
  readonly prefill: LastExerciseSets;
  readonly register: UseFormRegister<FormValues>;
  readonly setIndex: number;
  readonly striped: boolean;
  readonly watch: UseFormWatch<FormValues>;
};

export const RoutineWorkoutSetRow = ({
  errors,
  exerciseIndex,
  isBodyWeight,
  onAutoSave,
  prefill,
  register,
  setIndex,
  striped,
  watch,
}: RoutineWorkoutSetRowProps) => {
  const setErrors = errors.exercises?.[exerciseIndex]?.sets;
  const SetIcon = LOOKS_ICONS[setIndex] ?? Looks5Icon;
  const prefillEntry = prefill[setIndex];
  const weightError = setErrors?.[setIndex]?.weight?.message;
  const repsError = setErrors?.[setIndex]?.reps?.message;
  const weightField = register(
    `exercises.${exerciseIndex}.sets.${setIndex}.weight`,
  );
  const repsField = register(
    `exercises.${exerciseIndex}.sets.${setIndex}.reps`,
    {
      valueAsNumber: true,
    },
  );
  const completedField = register(
    `exercises.${exerciseIndex}.sets.${setIndex}.completed`,
  );
  const completed = watch(
    `exercises.${exerciseIndex}.sets.${setIndex}.completed`,
  );

  return (
    <Box
      sx={{
        alignItems: 'flex-start',
        bgcolor: completed
          ? '#81c78424'
          : striped
            ? 'action.hover'
            : 'transparent',
        borderRadius: 1,
        display: 'flex',
        gap: 1,
        padding: '15px 5px',
        transition: 'background-color 0.2s',
      }}
    >
      <SetIcon
        color="secondary"
        sx={{ mt: 1 }}
      />
      <TextField
        error={Boolean(weightError)}
        helperText={weightError}
        label="kg"
        placeholder={
          prefillEntry
            ? prefillEntry.weight === null
              ? ''
              : String(prefillEntry.weight)
            : ''
        }
        size="small"
        slotProps={
          isBodyWeight ? undefined : { htmlInput: { inputMode: 'decimal' } }
        }
        sx={{ flex: 1 }}
        type={isBodyWeight ? 'text' : 'number'}
        {...weightField}
        onBlur={(event) => {
          weightField.onBlur(event).catch(() => undefined);
          onAutoSave();
        }}
      />
      <TextField
        error={Boolean(repsError)}
        helperText={repsError}
        label="Reps"
        placeholder={prefillEntry ? String(prefillEntry.reps) : ''}
        size="small"
        slotProps={{ htmlInput: { inputMode: 'numeric', min: 1 } }}
        sx={{ flex: 1 }}
        type="number"
        {...repsField}
        onBlur={(event) => {
          repsField.onBlur(event).catch(() => undefined);
          onAutoSave();
        }}
      />
      <Checkbox
        {...completedField}
        checked={Boolean(completed)}
        color="success"
        onChange={(event) => {
          completedField.onChange(event);
          onAutoSave();
        }}
        sx={{ padding: 0.5 }}
      />
    </Box>
  );
};
