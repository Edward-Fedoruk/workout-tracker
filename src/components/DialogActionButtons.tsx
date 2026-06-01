import { Button } from '@mui/material';

export type DialogActionButtonsProps = {
  readonly cancelLabel?: string;
  readonly confirmColor?: 'error' | 'primary' | 'warning';
  readonly confirmDisabled?: boolean;
  readonly confirmLabel: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export const DialogActionButtons = ({
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  confirmDisabled,
  confirmLabel,
  onCancel,
  onConfirm,
}: DialogActionButtonsProps) => (
  <>
    <Button
      onClick={onCancel}
      sx={{ minHeight: 44, minWidth: 44 }}
    >
      {cancelLabel}
    </Button>
    <Button
      color={confirmColor}
      disabled={confirmDisabled}
      onClick={onConfirm}
      sx={{ minHeight: 44, minWidth: 44 }}
      variant="contained"
    >
      {confirmLabel}
    </Button>
  </>
);
