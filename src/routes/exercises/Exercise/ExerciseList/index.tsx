import { type Exercise } from '@/database';
import { MuscleGroupChip } from '@/routes/exercises/MuscleGroup/MuscleGroupChip';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  IconButton,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

export type ExerciseListProps = {
  readonly exercises: Exercise[];
  readonly onDelete: (exercise: Exercise) => void;
  readonly onEdit: (exercise: Exercise) => void;
};

export const ExerciseList = ({
  exercises,
  onDelete,
  onEdit,
}: ExerciseListProps) => {
  if (exercises.length === 0) {
    return <Typography color="text.secondary">No exercises yet.</Typography>;
  }

  return (
    <List>
      {exercises.map((exerciseItem) => (
        <ListItem
          divider
          key={exerciseItem.id}
          secondaryAction={
            <Stack
              direction="row"
              spacing={0.5}
            >
              <IconButton
                aria-label={`Edit ${exerciseItem.name}`}
                onClick={() => onEdit(exerciseItem)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                aria-label={`Delete ${exerciseItem.name}`}
                onClick={() => onDelete(exerciseItem)}
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          }
        >
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
