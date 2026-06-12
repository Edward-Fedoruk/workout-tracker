import { type Exercise } from '@/database';
import { MuscleGroupChip } from '@/routes/exercises/MuscleGroup/MuscleGroupChip';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

export type ExerciseListProps = {
  readonly exercises: Exercise[];
  readonly onNavigate: (exercise: Exercise) => void;
};

export const ExerciseList = ({ exercises, onNavigate }: ExerciseListProps) => {
  if (exercises.length === 0) {
    return <Typography color="text.secondary">No exercises yet.</Typography>;
  }

  return (
    <List>
      {exercises.map((exerciseItem) => (
        <ListItem
          divider
          key={exerciseItem.id}
          onClick={() => onNavigate(exerciseItem)}
          sx={{ cursor: 'pointer' }}
        >
          <ListItemAvatar sx={{ minWidth: 72 }}>
            <Avatar
              alt={exerciseItem.name}
              src={
                exerciseItem.imageFilename
                  ? `${import.meta.env.BASE_URL}exercises/${exerciseItem.imageFilename}`
                  : undefined
              }
              sx={{ height: 56, width: 56 }}
            >
              <FitnessCenterIcon />
            </Avatar>
          </ListItemAvatar>
          <Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center' }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                {exerciseItem.name}
              </Typography>
              {exerciseItem.muscleGroups.length === 0 && (
                <Tooltip title="No muscle groups assigned">
                  <WarningAmberIcon
                    color="warning"
                    fontSize="small"
                  />
                </Tooltip>
              )}
            </Stack>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
              useFlexGap
            >
              {exerciseItem.muscleGroups.map((group) => (
                <MuscleGroupChip
                  color={group.color}
                  key={group.id}
                  label={group.name}
                />
              ))}
            </Stack>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};
