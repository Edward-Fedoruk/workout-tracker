import { type RoutineWithExercises } from '@/database';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export type RoutineCardProps = {
  readonly isInProgress?: boolean;
  readonly onDelete: () => void;
  readonly onOpen: () => void;
  readonly routine: RoutineWithExercises;
};

export const RoutineCard = ({
  isInProgress = false,
  onDelete,
  onOpen,
  routine,
}: RoutineCardProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const hasExercises = routine.exercises.length > 0;

  return (
    <Card
      sx={{ mb: 1 }}
      variant="outlined"
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
          <ButtonBase
            onClick={onOpen}
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
          <IconButton
            aria-label="Routine options"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          onClose={() => setMenuAnchor(null)}
          open={Boolean(menuAnchor)}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onDelete();
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        </Menu>

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
