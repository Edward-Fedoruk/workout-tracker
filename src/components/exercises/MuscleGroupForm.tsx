import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';

type Props = {
  readonly duplicateError?: null | string | undefined;
  readonly initialName?: string | undefined;
  readonly mode: 'create' | 'edit';
  readonly onCancel: () => void;
  readonly onSave: (name: string) => void;
  readonly open: boolean;
};

export const MuscleGroupForm = ({
  duplicateError,
  initialName,
  mode,
  onCancel,
  onSave,
  open,
}: Props) => {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<null | string>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    /* eslint-disable react-hooks/set-state-in-effect -- syncing dialog open/initialName into form state on each open */
    setName(initialName ?? '');
    setNameError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialName, open]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setNameError('Name is required');
      return;
    }

    if (trimmed.length > 50) {
      setNameError('Name must be 50 characters or fewer');
      return;
    }

    onSave(trimmed);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={onCancel}
      open={open}
    >
      <DialogTitle>
        {mode === 'create' ? 'Add Muscle Group' : 'Rename Muscle Group'}
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <TextField
          autoFocus
          error={Boolean(nameError) || Boolean(duplicateError)}
          fullWidth
          helperText={nameError ?? duplicateError ?? ''}
          label="Muscle group name"
          onChange={(event) => {
            setName(event.target.value);
            setNameError(null);
          }}
          value={name}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onCancel}
          sx={{ minHeight: 44 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          sx={{ minHeight: 44 }}
          variant="contained"
        >
          {mode === 'create' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
