import {
  createWorkout,
  type Exercise,
  getBodyWeight,
  listExercises,
  updateWorkout,
  type WorkoutWithSets,
} from '../../database';
import {
  computeEffectiveWeight,
  computeERM,
  type ExerciseClassification,
} from '../../utils/erm';
import { ExercisePicker } from '../exercises/ExercisePicker';
import {
  type FormErrors,
  getToday,
  getWeightInputMin,
  hasFormErrors,
  makeSetInput,
  type SetInput,
  validateWorkoutForm,
} from './workoutFormUtilities';
import { WorkoutSetInputRow } from './WorkoutSetInputRow';
import {
  Box,
  Button,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

export type WorkoutFormProps = {
  readonly initialData?: WorkoutWithSets;
  readonly onCancel: () => void;
  readonly onSave: () => void;
};

export const WorkoutForm = ({
  initialData,
  onCancel,
  onSave,
}: WorkoutFormProps) => {
  const isEditing = initialData !== undefined;

  const [workoutDate, setWorkoutDate] = useState(
    initialData ? initialData.workoutDate : getToday(),
  );
  const [exerciseName, setExerciseName] = useState(
    initialData ? initialData.exerciseName : '',
  );
  const [sets, setSets] = useState<SetInput[]>(() => {
    if (initialData && initialData.sets.length > 0) {
      return initialData.sets.map((workoutSet) =>
        makeSetInput(
          workoutSet.weight === null ? '' : String(workoutSet.weight),
          String(workoutSet.reps),
        ),
      );
    }

    return [makeSetInput()];
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeight, setBodyWeight] = useState<null | number>(null);
  const [errors, setErrors] = useState<FormErrors>({ sets: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<null | string>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      const [exerciseList, bw] = await Promise.all([
        listExercises(),
        getBodyWeight(),
      ]);
      setExercises(exerciseList);
      setBodyWeight(bw);
    };

    loadLibrary().catch(() => undefined);
  }, []);

  const classification: ExerciseClassification =
    exercises.find((option) => option.name === exerciseName)?.classification ??
    'standard';

  const validate = useCallback((): boolean => {
    const newErrors = validateWorkoutForm({
      bodyWeight,
      classification,
      exerciseName,
      sets,
      workoutDate,
    });
    setErrors(newErrors);
    return !hasFormErrors(newErrors);
  }, [bodyWeight, classification, exerciseName, sets, workoutDate]);

  const computeSetERM = useCallback(
    (rawWeight: string, reps: number): null | number => {
      const loggedWeight =
        rawWeight.trim() === '' ? null : Number.parseFloat(rawWeight);
      const effective = computeEffectiveWeight({
        bodyWeight,
        classification,
        loggedWeight,
      });
      if (effective === null) {
        return null;
      }

      return computeERM(effective, reps);
    },
    [bodyWeight, classification],
  );

  const handleSave = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    const parsedSets = sets.map((setInput) => {
      const reps = Number.parseInt(setInput.reps, 10);
      const weight =
        setInput.weight.trim() === ''
          ? null
          : Number.parseFloat(setInput.weight);
      const erm = computeSetERM(setInput.weight, reps);
      return { erm, reps, weight };
    });

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
    } catch {
      setSubmitError('Failed to save workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    computeSetERM,
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

  const weightMin = getWeightInputMin(classification);
  const weightInputProps =
    weightMin === undefined ? { step: '0.1' } : { min: weightMin, step: '0.1' };

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

      <ExercisePicker
        error={Boolean(errors.exerciseName)}
        exercises={exercises}
        helperText={errors.exerciseName}
        onChange={(next) => {
          setExerciseName(next ? next.name : '');
        }}
        value={exercises.find((option) => option.name === exerciseName) ?? null}
      />

      <Box>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Sets</Typography>
        {sets.map((set, index) => (
          <WorkoutSetInputRow
            errors={errors.sets[index]}
            index={index}
            key={set._key}
            onChange={(field, value) => updateSet(index, field, value)}
            reps={set.reps}
            weight={set.weight}
            weightInputProps={weightInputProps}
          />
        ))}

        {errors.general && (
          <FormHelperText
            error
            sx={{ mb: 1 }}
          >
            {errors.general}
          </FormHelperText>
        )}

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1 }}
        >
          <Button
            disabled={sets.length >= 5}
            onClick={addSet}
            size="small"
            variant="outlined"
          >
            + Add Set
          </Button>
          {sets.length > 1 && (
            <Button
              onClick={removeLastSet}
              size="small"
            >
              − Remove Last Set
            </Button>
          )}
        </Stack>
      </Box>

      {submitError && <Typography color="error">{submitError}</Typography>}

      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'flex-end' }}
      >
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          disabled={isLoading}
          onClick={() => {
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
