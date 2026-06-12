import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

export type WorkoutRowActionsProps = {
  readonly onDelete: () => void;
  readonly onEdit: () => void;
};

export const WorkoutRowActions = ({
  onDelete,
  onEdit,
}: WorkoutRowActionsProps) => {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElement(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElement(null);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorElement}
        onClose={handleClose}
        open={Boolean(anchorElement)}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onEdit();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};
