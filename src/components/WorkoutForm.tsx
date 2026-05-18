import {
  createWorkout,
  updateWorkout,
  type WorkoutWithSets,
} from '../database';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
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
      debugger
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
    <VStack
      align="stretch"
      spacing={4}
    >
      <FormControl isInvalid={Boolean(errors.workoutDate)}>
        <FormLabel>Date</FormLabel>
        <Input
          max={getToday()}
          onChange={(event) => {
            setWorkoutDate(event.target.value);
          }}
          type="date"
          value={workoutDate}
        />
        <FormErrorMessage>{errors.workoutDate}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={Boolean(errors.exerciseName)}>
        <FormLabel>Exercise</FormLabel>
        <Input
          onChange={(event) => {
            setExerciseName(event.target.value);
          }}
          placeholder="e.g. Bench Press"
          value={exerciseName}
        />
        <FormErrorMessage>{errors.exerciseName}</FormErrorMessage>
      </FormControl>

      <Box>
        <Text
          fontWeight="semibold"
          mb={2}
        >
          Sets
        </Text>
        {sets.map((set, index) => (
          <HStack
            align="flex-start"
            key={set._key}
            mb={2}
            spacing={2}
          >
            <Text
              color="gray.500"
              minWidth="20px"
              pt={2}
            >
              {index + 1}.
            </Text>
            <FormControl isInvalid={Boolean(errors.sets[index]?.weight)}>
              <Input
                min="0.1"
                onChange={(event) => {
                  updateSet(index, 'weight', event.target.value);
                }}
                placeholder="kg"
                step="0.1"
                type="number"
                value={set.weight}
              />
              <FormErrorMessage>{errors.sets[index]?.weight}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={Boolean(errors.sets[index]?.reps)}>
              <Input
                min="1"
                onChange={(event) => {
                  updateSet(index, 'reps', event.target.value);
                }}
                placeholder="reps"
                step="1"
                type="number"
                value={set.reps}
              />
              <FormErrorMessage>{errors.sets[index]?.reps}</FormErrorMessage>
            </FormControl>
          </HStack>
        ))}

        {errors.general && (
          <Text
            color="red.500"
            fontSize="sm"
            mb={2}
          >
            {errors.general}
          </Text>
        )}

        <HStack
          mt={2}
          spacing={2}
        >
          <Button
            isDisabled={sets.length >= 5}
            onClick={addSet}
            size="sm"
            variant="outline"
          >
            + Add Set
          </Button>
          {sets.length > 1 && (
            <Button
              onClick={removeLastSet}
              size="sm"
              variant="ghost"
            >
              − Remove Last Set
            </Button>
          )}
        </HStack>
      </Box>

      {submitError && <Text color="red.500">{submitError}</Text>}

      <HStack
        justify="flex-end"
        spacing={2}
      >
        <Button
          onClick={onCancel}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          colorScheme="blue"
          isLoading={isLoading}
          onClick={() => {
            // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
            handleSave().catch(() => undefined);
          }}
        >
          {isEditing ? 'Update Workout' : 'Save Workout'}
        </Button>
      </HStack>
    </VStack>
  );
};
