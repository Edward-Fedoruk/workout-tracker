import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type Props = {
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
};

export const DeleteWorkoutDialog = ({ onCancel, onConfirm, open }: Props) => (
  <Dialog
    onClose={onCancel}
    open={open}
  >
    <DialogTitle>Delete Workout</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete this workout? This cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button
        color="error"
        onClick={onConfirm}
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);
