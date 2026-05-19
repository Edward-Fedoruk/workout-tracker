import {
  createWorkout,
  updateWorkout,
  type WorkoutWithSets,
} from '../database';
import {
  Box,
  Button,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';

type FormErrors = {
  exerciseName?: string;
  general?: string;
  sets: SetErrors[];
  workoutDate?: string;
};

type Props = {
  readonly initialData?: WorkoutWithSets;
  readonly onCancel: () => void;
  readonly onSave: () => void;
};

type SetErrors = {
  reps?: string;
  weight?: string;
};

type SetInput = {
  _key: string;
  reps: string;
  weight: string;
};

const getToday = () => new Date().toISOString().slice(0, 10);

const makeSetInput = (weight = '', reps = ''): SetInput => ({
  _key: crypto.randomUUID(),
  reps,
  weight,
});

export const WorkoutForm = ({ initialData, onCancel, onSave }: Props) => {
  const isEditing = initialData !== undefined;

  const [workoutDate, setWorkoutDate] = useState(
    initialData ? initialData.workout_date : getToday(),
  );
  const [exerciseName, setExerciseName] = useState(
    initialData ? initialData.exercise_name : '',
  );
  const [sets, setSets] = useState<SetInput[]>(() => {
    if (initialData && initialData.sets.length > 0) {
      return initialData.sets.map((workoutSet) =>
        makeSetInput(String(workoutSet.weight), String(workoutSet.reps)),
      );
    }

    return [makeSetInput()];
  });
  const [errors, setErrors] = useState<FormErrors>({ sets: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<null | string>(null);

  const validate = useCallback((): boolean => {
    const today = getToday();
    const newErrors: FormErrors = { sets: [] };

    if (workoutDate > today) {
      newErrors.workoutDate = 'Cannot log future workouts';
    }

    if (!exerciseName.trim()) {
      newErrors.exerciseName = 'Exercise name is required';
    }

    if (sets.length === 0) {
      newErrors.general = 'Must have at least 1 set';
    }

    for (const set of sets) {
      const setError: SetErrors = {};
      const weightValue = Number.parseFloat(set.weight);
      const repsValue = Number.parseInt(set.reps, 10);

      if (!set.weight || Number.isNaN(weightValue) || weightValue <= 0) {
        setError.weight = 'Weight must be greater than 0';
      }

      if (!set.reps || Number.isNaN(repsValue) || repsValue <= 0) {
        setError.reps = 'Reps must be greater than 0';
      }

      newErrors.sets.push(setError);
    }

    setErrors(newErrors);

    return (
      !newErrors.workoutDate &&
      !newErrors.exerciseName &&
      !newErrors.general &&
      newErrors.sets.every((setError) => !setError.weight && !setError.reps)
    );
  }, [exerciseName, sets, workoutDate]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    const parsedSets = sets.map((setInput) => ({
      reps: Number.parseInt(setInput.reps, 10),
      weight: Number.parseFloat(setInput.weight),
    }));

    try {
      if (isEditing && initialData) {
        await updateWorkout(
          initialData.id,
          workoutDate,
          exerciseName,
          parsedSets,
        );
      } else {
        await createWorkout(workoutDate, exerciseName, parsedSets);
      }

      onSave();
    } catch (e) {
      setSubmitError('Failed to save workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    exerciseName,
    initialData,
    isEditing,
    onSave,
    sets,
    validate,
    workoutDate,
  ]);

  const addSet = useCallback(() => {
    if (sets.length < 5) {
      setSets((previous) => [...previous, makeSetInput()]);
    }
  }, [sets.length]);

  const removeLastSet = useCallback(() => {
    if (sets.length > 1) {
      setSets((previous) => previous.slice(0, -1));
    }
  }, [sets.length]);

  const updateSet = useCallback(
    (index: number, field: 'reps' | 'weight', value: string) => {
      setSets((previous) =>
        previous.map((setItem, setIndex) =>
          setIndex === index ? { ...setItem, [field]: value } : setItem,
        ),
      );
    },
    [],
  );

  return (
    <Stack spacing={2}>
      <TextField
        error={Boolean(errors.workoutDate)}
        fullWidth
        helperText={errors.workoutDate}
        label="Date"
        onChange={(event) => {
          setWorkoutDate(event.target.value);
        }}
        slotProps={{ htmlInput: { max: getToday() } }}
        type="date"
        value={workoutDate}
      />

      <TextField
        error={Boolean(errors.exerciseName)}
        fullWidth
        helperText={errors.exerciseName}
        label="Exercise"
        onChange={(event) => {
          setExerciseName(event.target.value);
        }}
        placeholder="e.g. Bench Press"
        value={exerciseName}
      />

      <Box>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>
          Sets
        </Typography>
        {sets.map((set, index) => (
          <Stack
            direction="row"
            key={set._key}
            spacing={1}
            sx={{ alignItems: 'flex-start', mb: 1 }}
          >
            <Typography color="text.secondary" sx={{ minWidth: 20, pt: 1.5 }}>
              {index + 1}.
            </Typography>
            <TextField
              error={Boolean(errors.sets[index]?.weight)}
              helperText={errors.sets[index]?.weight}
              onChange={(event) => {
                updateSet(index, 'weight', event.target.value);
              }}
              placeholder="kg"
              size="small"
              slotProps={{ htmlInput: { min: '0.1', step: '0.1' } }}
              type="number"
              value={set.weight}
            />
            <TextField
              error={Boolean(errors.sets[index]?.reps)}
              helperText={errors.sets[index]?.reps}
              onChange={(event) => {
                updateSet(index, 'reps', event.target.value);
              }}
              placeholder="reps"
              size="small"
              slotProps={{ htmlInput: { min: '1', step: '1' } }}
              type="number"
              value={set.reps}
            />
          </Stack>
        ))}

        {errors.general && (
          <FormHelperText error sx={{ mb: 1 }}>
            {errors.general}
          </FormHelperText>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            disabled={sets.length >= 5}
            onClick={addSet}
            size="small"
            variant="outlined"
          >
            + Add Set
          </Button>
          {sets.length > 1 && (
            <Button onClick={removeLastSet} size="small">
              − Remove Last Set
            </Button>
          )}
        </Stack>
      </Box>

      {submitError && <Typography color="error">{submitError}</Typography>}

      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          disabled={isLoading}
          onClick={() => {
            // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
            handleSave().catch(() => undefined);
          }}
          variant="contained"
        >
          {isEditing ? 'Update Workout' : 'Save Workout'}
        </Button>
      </Stack>
    </Stack>
  );
};
