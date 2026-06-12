import { type LastExerciseSets, type RoutineExercise } from '@/database';
import { formatRepRange } from '@/routes/routines/routineUtilities';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Looks3Icon from '@mui/icons-material/Looks3';
import Looks4Icon from '@mui/icons-material/Looks4';
import Looks5Icon from '@mui/icons-material/Looks5';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import {
  Avatar,
  Box,
  ButtonBase,
  Checkbox,
  TextField,
  Typography,
} from '@mui/material';
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

export type RoutineWorkoutExerciseProps = {
  readonly errors: FieldErrors<FormValues>;
  readonly exercise: RoutineExercise;
  readonly exerciseIndex: number;
  readonly imageFilename?: string | undefined;
  readonly onAutoSave: () => void;
  readonly onNavigateToExercise?: () => void;
  readonly prefill: LastExerciseSets;
  readonly register: UseFormRegister<FormValues>;
  readonly watch: UseFormWatch<FormValues>;
};

export const RoutineWorkoutExercise = ({
  errors,
  exercise,
  exerciseIndex,
  imageFilename,
  onAutoSave,
  onNavigateToExercise,
  prefill,
  register,
  watch,
}: RoutineWorkoutExerciseProps) => {
  const setErrors = errors.exercises?.[exerciseIndex]?.sets;

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, mb: 3 }}>
        <Avatar
          alt={exercise.exerciseName}
          src={
            imageFilename
              ? `${import.meta.env.BASE_URL}exercises/${imageFilename}`
              : undefined
          }
          sx={{ height: 56, width: 56 }}
        >
          <FitnessCenterIcon />
        </Avatar>
        <Box>
          {onNavigateToExercise ? (
            <ButtonBase
              onClick={onNavigateToExercise}
              sx={{ display: 'block', textAlign: 'left' }}
            >
              <Typography
                sx={{ fontWeight: 'bold' }}
                variant="subtitle1"
              >
                {exercise.exerciseName}
              </Typography>
            </ButtonBase>
          ) : (
            <Typography
              sx={{ fontWeight: 'bold' }}
              variant="subtitle1"
            >
              {exercise.exerciseName}
            </Typography>
          )}
          <Typography
            color="text.secondary"
            variant="body2"
          >
            Target: {exercise.suggestedSets} ×{' '}
            {formatRepRange(exercise.minReps, exercise.maxReps)}
          </Typography>
        </Box>
      </Box>
      {Array.from({ length: exercise.suggestedSets }, (_unused, setIndex) => {
        const SetIcon = LOOKS_ICONS[setIndex] ?? Looks5Icon;
        const prefillEntry = prefill[setIndex];
        const weightError = setErrors?.[setIndex]?.weight?.message;
        const repsError = setErrors?.[setIndex]?.reps?.message;
        const weightField = register(
          `exercises.${exerciseIndex}.sets.${setIndex}.weight`,
          { valueAsNumber: true },
        );
        const repsField = register(
          `exercises.${exerciseIndex}.sets.${setIndex}.reps`,
          { valueAsNumber: true },
        );
        const completedField = register(
          `exercises.${exerciseIndex}.sets.${setIndex}.completed`,
        );
        const completed = watch(
          `exercises.${exerciseIndex}.sets.${setIndex}.completed`,
        );
        return (
          <Box
            key={setIndex}
            sx={{
              alignItems: 'flex-start',
              bgcolor: completed ? '#81c78424' : 'transparent',
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
              slotProps={{
                htmlInput: { inputMode: 'decimal', min: 0, step: 0.5 },
              }}
              sx={{ flex: 1 }}
              type="number"
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
      })}
    </Box>
  );
};
