import { type RoutineWithExercises } from '../../database';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';

type Props = {
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onStart: () => void;
  readonly routine: RoutineWithExercises;
};

export const RoutineCard = ({ onDelete, onEdit, onStart, routine }: Props) => {
  const exerciseCount = routine.exercises.length;
  const hasExercises = exerciseCount > 0;

  return (
    <Card
      sx={{ mb: 1 }}
      variant="outlined"
    >
      <CardContent sx={{ pb: 0 }}>
        <Typography
          component="div"
          variant="h6"
        >
          {routine.name}
        </Typography>
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
