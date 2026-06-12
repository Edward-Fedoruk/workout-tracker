import { type RoutineWithExercises } from '@/database';
import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';

export type RoutineCardProps = {
  readonly isInProgress?: boolean;
  readonly onEdit: () => void;
  readonly onStart: () => void;
  readonly routine: RoutineWithExercises;
};

export const RoutineCard = ({
  isInProgress = false,
  onEdit,
  onStart,
  routine,
}: RoutineCardProps) => {
  const hasExercises = routine.exercises.length > 0;

  return (
    <Card
      sx={{ mb: 1 }}
      variant="outlined"
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
          <ButtonBase
            onClick={onEdit}
            sx={{
              flex: 1,
              gap: 2,
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
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
          </ButtonBase>
          <Tooltip
            disableHoverListener={hasExercises}
            title={hasExercises ? '' : 'Add exercises before starting'}
          >
            <span>
              <Button
                color="success"
                disabled={!hasExercises}
                onClick={onStart}
                size="small"
                variant="contained"
              >
                {isInProgress ? 'Continue' : 'Start'}
              </Button>
            </span>
          </Tooltip>
        </Box>
        {hasExercises && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
            {routine.exercises.map((exercise) => (
              <Chip
                key={exercise.id}
                label={exercise.exerciseName}
                size="small"
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
