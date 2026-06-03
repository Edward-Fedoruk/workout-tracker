import { type LastExerciseSets, type RoutineExercise } from '@/database';
import { formatRepRange } from '@/routes/routines/routineUtilities';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import { Box, TextField, Typography } from '@mui/material';
import { type FieldErrors, type UseFormRegister } from 'react-hook-form';

export type RoutineWorkoutExerciseProps = {
  readonly errors: FieldErrors<FormValues>;
  readonly exercise: RoutineExercise;
  readonly exerciseIndex: number;
  readonly prefill: LastExerciseSets;
  readonly register: UseFormRegister<FormValues>;
};

export const RoutineWorkoutExercise = ({
  errors,
  exercise,
  exerciseIndex,
  prefill,
  register,
}: RoutineWorkoutExerciseProps) => {
  const setErrors = errors.exercises?.[exerciseIndex]?.sets;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{ fontWeight: 'bold' }}
        variant="subtitle1"
      >
        {exercise.exerciseName}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mb: 1 }}
        variant="body2"
      >
        Target: {exercise.suggestedSets} ×{' '}
        {formatRepRange(exercise.minReps, exercise.maxReps)}
      </Typography>
      {Array.from({ length: exercise.suggestedSets }, (_unused, setIndex) => {
        const prefillEntry = prefill[setIndex];
        const weightError = setErrors?.[setIndex]?.weight?.message;
        const repsError = setErrors?.[setIndex]?.reps?.message;
        return (
          <Box
            key={setIndex}
            sx={{ alignItems: 'flex-start', display: 'flex', gap: 1, mb: 1 }}
          >
            <Typography
              sx={{ minWidth: 40, pt: 1.5 }}
              variant="body2"
            >
              Set {setIndex + 1}
            </Typography>
            <TextField
              error={Boolean(weightError)}
              helperText={weightError}
              label="Weight (kg)"
              placeholder={
                prefillEntry
                  ? prefillEntry.weight === null
                    ? ''
                    : String(prefillEntry.weight)
                  : ''
              }
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              sx={{ flex: 1 }}
              type="number"
              {...register(
                `exercises.${exerciseIndex}.sets.${setIndex}.weight`,
                { valueAsNumber: true },
              )}
            />
            <TextField
              error={Boolean(repsError)}
              helperText={repsError}
              label="Reps"
              placeholder={prefillEntry ? String(prefillEntry.reps) : ''}
              size="small"
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ flex: 1 }}
              type="number"
              {...register(`exercises.${exerciseIndex}.sets.${setIndex}.reps`, {
                valueAsNumber: true,
              })}
            />
          </Box>
        );
      })}
    </Box>
  );
};
