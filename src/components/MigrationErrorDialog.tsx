import { type MigrationError } from '../db/migrations';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type Props = {
  readonly error: MigrationError;
  readonly onReset: () => void;
};

export const MigrationErrorDialog = ({ error, onReset }: Props) => {
  return (
    <Dialog
      aria-describedby="migration-error-description"
      aria-labelledby="migration-error-title"
      onClose={() => undefined}
      open
    >
      <DialogTitle id="migration-error-title">Database Error</DialogTitle>
      <DialogContent>
        <DialogContentText id="migration-error-description">
          A database migration error occurred
          {error.migrationName ? ` in migration "${error.migrationName}"` : ''}.
        </DialogContentText>
        <DialogContentText
          sx={{ fontFamily: 'monospace', fontSize: '0.85em', mt: 1 }}
        >
          {error.message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => location.reload()}
          sx={{ minHeight: 44, minWidth: 44 }}
        >
          Retry
        </Button>
        <Button
          color="error"
          onClick={onReset}
          sx={{ minHeight: 44, minWidth: 44 }}
        >
          Reset Database
        </Button>
      </DialogActions>
    </Dialog>
  );
};
