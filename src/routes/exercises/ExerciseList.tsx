import { type Exercise } from '../../database';
import { contrastText } from './muscleGroupColors';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

type Props = {
  readonly exercises: Exercise[];
  readonly onDelete: (exercise: Exercise) => void;
  readonly onEdit: (exercise: Exercise) => void;
};

export const ExerciseList = ({ exercises, onDelete, onEdit }: Props) => {
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
                sx={{ minHeight: 44, minWidth: 44 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                aria-label={`Delete ${exerciseItem.name}`}
                onClick={() => onDelete(exerciseItem)}
                sx={{ minHeight: 44, minWidth: 44 }}
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
              sx={{ flexWrap: 'wrap', mt: 0.5 }}
            >
              {exerciseItem.muscleGroups.map((group) => (
                <Chip
                  key={group.id}
                  label={group.name}
                  size="small"
                  sx={{
                    backgroundColor: group.color,
                    color: contrastText(group.color),
                    mb: 0.5,
                  }}
                />
              ))}
            </Stack>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};
