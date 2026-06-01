import { type MuscleGroup } from '../../database';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

export type MuscleGroupListProps = {
  readonly muscleGroups: MuscleGroup[];
  readonly onDelete: (group: MuscleGroup) => void;
  readonly onRename: (group: MuscleGroup) => void;
};

export const MuscleGroupList = ({
  muscleGroups,
  onDelete,
  onRename,
}: MuscleGroupListProps) => {
  if (muscleGroups.length === 0) {
    return (
      <Typography color="text.secondary">No muscle groups yet.</Typography>
    );
  }

  return (
    <List>
      {muscleGroups.map((group) => (
        <ListItem
          divider
          key={group.id}
          secondaryAction={
            <Stack
              direction="row"
              spacing={0.5}
            >
              <IconButton
                aria-label={`Rename ${group.name}`}
                onClick={() => onRename(group)}
                sx={{ minHeight: 44, minWidth: 44 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                aria-label={`Delete ${group.name}`}
                onClick={() => onDelete(group)}
                sx={{ minHeight: 44, minWidth: 44 }}
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          }
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center' }}
          >
            <Box
              aria-hidden
              sx={{
                backgroundColor: group.color,
                borderRadius: '50%',
                flexShrink: 0,
                height: 18,
                width: 18,
              }}
            />
            <ListItemText primary={group.name} />
          </Stack>
        </ListItem>
      ))}
    </List>
  );
};
