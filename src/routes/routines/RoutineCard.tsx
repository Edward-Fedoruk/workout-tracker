import { type RoutineWithExercises } from '@/database';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';

export type RoutineCardProps = {
  readonly isInProgress?: boolean;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onStart: () => void;
  readonly routine: RoutineWithExercises;
};

export const RoutineCard = ({
  isInProgress = false,
  onDelete,
  onEdit,
  onStart,
  routine,
}: RoutineCardProps) => {
  const exerciseCount = routine.exercises.length;
  const hasExercises = exerciseCount > 0;

  return (
    <Card
      sx={{ mb: 1 }}
      variant="outlined"
    >
      <CardContent sx={{ pb: 0 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
          <Typography
            component="div"
            variant="h6"
          >
            {routine.name}
          </Typography>
          {isInProgress && (
            <Chip
              label="In Progress"
              size="small"
              sx={{
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                fontWeight: 700,
              }}
            />
          )}
        </Box>
        <Chip
          label={`${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`}
          size="small"
          sx={{ mt: 0.5 }}
        />
      </CardContent>
      <CardActions>
        <Button
          onClick={onEdit}
          size="small"
        >
          Edit
        </Button>
        <Button
          color="error"
          onClick={onDelete}
          size="small"
        >
          Delete
        </Button>
        <Tooltip
          disableHoverListener={hasExercises}
          title={hasExercises ? '' : 'Add exercises before starting'}
        >
          <span>
            <Button
              color="primary"
              disabled={!hasExercises}
              onClick={onStart}
              size="small"
            >
              Start
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
};
