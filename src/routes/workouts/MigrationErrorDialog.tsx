import { ConfirmDialog } from '../../components';
import { type MigrationError } from '../../db/migrations';
import { Button, DialogContentText } from '@mui/material';

type Props = {
  readonly error: MigrationError;
  readonly onReset: () => void;
};

export const MigrationErrorDialog = ({ error, onReset }: Props) => (
  <ConfirmDialog
    confirmColor="error"
    confirmLabel="Reset Database"
    onConfirm={onReset}
    open
    title="Database Error"
  >
    <DialogContentText>
      A database migration error occurred
      {error.migrationName ? ` in migration "${error.migrationName}"` : ''}.
    </DialogContentText>
    <DialogContentText
      sx={{ fontFamily: 'monospace', fontSize: '0.85em', mt: 1 }}
    >
      {error.message}
    </DialogContentText>
    <Button
      onClick={() => location.reload()}
      sx={{ minHeight: 44, minWidth: 44, mt: 2 }}
    >
      Retry
    </Button>
  </ConfirmDialog>
);
