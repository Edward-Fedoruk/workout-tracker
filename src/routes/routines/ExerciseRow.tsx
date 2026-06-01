import { type RoutineExercise } from '../../database';
import { formatRepRange } from './routineUtilities';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton, Typography } from '@mui/material';

export type ExerciseRowProps = {
  readonly exercise: RoutineExercise;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onMoveDown: () => void;
  readonly onMoveUp: () => void;
};

export const ExerciseRow = ({
  exercise,
  isFirst,
  isLast,
  onDelete,
  onEdit,
  onMoveDown,
  onMoveUp,
}: ExerciseRowProps) => (
  <Box
    sx={{
      alignItems: 'center',
      borderBottom: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      gap: 0.5,
      py: 0.5,
    }}
  >
    <Box sx={{ flex: 1 }}>
      <Typography variant="body1">{exercise.exerciseName}</Typography>
      <Typography
        color="text.secondary"
        variant="body2"
      >
        {exercise.suggestedSets} ×{' '}
        {formatRepRange(exercise.minReps, exercise.maxReps)}
      </Typography>
    </Box>
    <IconButton
      aria-label="Move up"
      disabled={isFirst}
      onClick={onMoveUp}
      size="small"
      sx={{ minHeight: 44, minWidth: 44 }}
    >
      <ArrowUpwardIcon fontSize="small" />
    </IconButton>
    <IconButton
      aria-label="Move down"
      disabled={isLast}
      onClick={onMoveDown}
      size="small"
      sx={{ minHeight: 44, minWidth: 44 }}
    >
      <ArrowDownwardIcon fontSize="small" />
    </IconButton>
    <IconButton
      aria-label="Edit exercise"
      onClick={onEdit}
      size="small"
      sx={{ minHeight: 44, minWidth: 44 }}
    >
      <EditIcon fontSize="small" />
    </IconButton>
    <IconButton
      aria-label="Delete exercise"
      color="error"
      onClick={onDelete}
      size="small"
      sx={{ minHeight: 44, minWidth: 44 }}
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Box>
);
