import { ConfirmDialog } from '@/components';

export type ConfirmImportDialogProps = {
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
}: ConfirmImportDialogProps) => (
  <ConfirmDialog
    confirmColor="error"
    confirmLabel="Confirm Import"
    onCancel={onCancel}
    onConfirm={onConfirm}
    open={open}
    title="Import Database"
  >
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
  </ConfirmDialog>
);
