import { DialogActionButtons } from './DialogActionButtons';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import React from 'react';

type ConfirmDialogProps = {
  readonly cancelLabel?: string;
  readonly children: React.ReactNode;
  readonly confirmColor?: 'error' | 'primary' | 'warning';
  readonly confirmLabel: string;
  readonly onCancel?: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
  readonly title: string;
};

export const ConfirmDialog = ({
  cancelLabel,
  children,
  confirmColor,
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) => (
  <Dialog
    onClose={onCancel ?? (() => undefined)}
    open={open}
  >
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      {onCancel === undefined ? (
        <Button
          color={confirmColor}
          onClick={onConfirm}
          sx={{ minHeight: 44, minWidth: 44 }}
          variant="contained"
        >
          {confirmLabel}
        </Button>
      ) : (
        <DialogActionButtons
          {...(cancelLabel !== undefined && { cancelLabel })}
          {...(confirmColor !== undefined && { confirmColor })}
          confirmLabel={confirmLabel}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      )}
    </DialogActions>
  </Dialog>
);
