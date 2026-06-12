import { formatRepRange } from './routineUtilities';
import { type RoutineExercise } from '@/database';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, ButtonBase, IconButton, Typography } from '@mui/material';

export type ExerciseRowProps = {
  readonly exercise: RoutineExercise;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onMoveDown: () => void;
  readonly onMoveUp: () => void;
  readonly onNavigateToExercise?: () => void;
};

export const ExerciseRow = ({
  exercise,
  isFirst,
  isLast,
  onDelete,
  onEdit,
  onMoveDown,
  onMoveUp,
  onNavigateToExercise,
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
      {onNavigateToExercise ? (
        <ButtonBase
          onClick={onNavigateToExercise}
          sx={{ display: 'block', textAlign: 'left' }}
        >
          <Typography variant="body1">{exercise.exerciseName}</Typography>
        </ButtonBase>
      ) : (
        <Typography variant="body1">{exercise.exerciseName}</Typography>
      )}
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
    >
      <ArrowUpwardIcon fontSize="small" />
    </IconButton>
    <IconButton
      aria-label="Move down"
      disabled={isLast}
      onClick={onMoveDown}
      size="small"
    >
      <ArrowDownwardIcon fontSize="small" />
    </IconButton>
    <IconButton
      aria-label="Edit exercise"
      onClick={onEdit}
      size="small"
    >
      <EditIcon fontSize="small" />
    </IconButton>
    <IconButton
      aria-label="Delete exercise"
      color="error"
      onClick={onDelete}
      size="small"
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Box>
);
