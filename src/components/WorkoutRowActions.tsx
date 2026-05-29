import { Box, Button } from '@mui/material';

type Props = {
  readonly onDelete: () => void;
  readonly onEdit: () => void;
};

export const WorkoutRowActions = ({ onDelete, onEdit }: Props) => (
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Button
      onClick={onEdit}
      size="small"
      variant="outlined"
    >
      Edit
    </Button>
    <Button
      color="error"
      onClick={onDelete}
      size="small"
      variant="outlined"
    >
      Delete
    </Button>
  </Box>
);
