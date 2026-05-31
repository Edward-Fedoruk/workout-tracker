import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import React from 'react';

type FormDialogProps = {
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly fullWidth?: boolean;
  readonly maxWidth?: 'md' | 'sm' | 'xs';
  readonly onClose: () => void;
  readonly open: boolean;
  readonly title: string;
};

export const FormDialog = ({
  actions,
  children,
  fullWidth = true,
  maxWidth = 'xs',
  onClose,
  open,
  title,
}: FormDialogProps) => (
  <Dialog
    fullWidth={fullWidth}
    maxWidth={maxWidth}
    onClose={onClose}
    open={open}
  >
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    {actions !== undefined && <DialogActions>{actions}</DialogActions>}
  </Dialog>
);
