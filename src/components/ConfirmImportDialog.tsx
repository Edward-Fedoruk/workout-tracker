import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

type ConfirmImportDialogProps = {
  readonly filename: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
};

export const ConfirmImportDialog = ({
  filename,
  onCancel,
  onConfirm,
  open,
}: ConfirmImportDialogProps) => {
  return (
    <Dialog
      onClose={onCancel}
      open={open}
    >
      <DialogTitle>Import Database</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <div>
          You are about to replace your entire database with{' '}
          <strong>{filename}</strong>. This action:
        </div>
        <ul style={{ marginTop: 12 }}>
          <li>Will wipe your entire current database</li>
          <li>Will automatically reload the app</li>
        </ul>
        <div style={{ color: 'error.main' }}>
          This cannot be undone. Make sure you have a backup.
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          color="error"
          onClick={onConfirm}
          variant="contained"
        >
          Confirm Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};
