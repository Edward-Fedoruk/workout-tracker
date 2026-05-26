import { type LastExerciseSets, type RoutineExercise } from '../../database';
import { Box, TextField, Typography } from '@mui/material';
import { useState } from 'react';

type Props = {
  readonly exercise: RoutineExercise;
  readonly onChange: (sets: SetValue[]) => void;
  readonly prefill: LastExerciseSets;
};

type SetValue = { reps: string; weight: string };

export const RoutineWorkoutExercise = ({
  exercise,
  onChange,
  prefill,
}: Props) => {
  const [values, setValues] = useState<SetValue[]>(() =>
    Array.from({ length: exercise.suggestedSets }, () => ({
      reps: '',
      weight: '',
    })),
  );

  const handleChange = (
    index: number,
    field: 'reps' | 'weight',
    value: string,
  ) => {
    const updated = values.map((setEntry, index_) =>
      index_ === index ? { ...setEntry, [field]: value } : setEntry,
    );
    setValues(updated);
    onChange(updated);
  };

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
        Suggested: {exercise.suggestedSets} × {exercise.suggestedReps}
      </Typography>
      {values.map((setEntry, index) => {
        const prefillEntry = prefill[index];
        return (
          <Box
            key={index} // eslint-disable-line react/no-array-index-key -- set slots are positional and never reordered
            sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 1 }}
          >
            <Typography
              sx={{ minWidth: 40 }}
              variant="body2"
            >
              Set {index + 1}
            </Typography>
            <TextField
              label="Weight (kg)"
              onChange={(event) =>
                handleChange(index, 'weight', event.target.value)
              }
              placeholder={prefillEntry ? String(prefillEntry.weight) : ''}
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              sx={{ flex: 1 }}
              type="number"
              value={setEntry.weight}
            />
            <TextField
              label="Reps"
              onChange={(event) =>
                handleChange(index, 'reps', event.target.value)
              }
              placeholder={prefillEntry ? String(prefillEntry.reps) : ''}
              size="small"
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ flex: 1 }}
              type="number"
              value={setEntry.reps}
            />
          </Box>
        );
      })}
    </Box>
  );
};
