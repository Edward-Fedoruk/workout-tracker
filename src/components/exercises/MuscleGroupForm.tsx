import {
  DEFAULT_MUSCLE_GROUP_COLOR,
  MUSCLE_GROUP_PALETTE,
} from './muscleGroupColors';
import CheckIcon from '@mui/icons-material/Check';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

type Props = {
  readonly duplicateError?: null | string | undefined;
  readonly initialColor?: string | undefined;
  readonly initialName?: string | undefined;
  readonly mode: 'create' | 'edit';
  readonly onCancel: () => void;
  readonly onSave: (name: string, color: string) => void;
  readonly open: boolean;
};

export const MuscleGroupForm = ({
  duplicateError,
  initialColor,
  initialName,
  mode,
  onCancel,
  onSave,
  open,
}: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_MUSCLE_GROUP_COLOR);
  const [nameError, setNameError] = useState<null | string>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    /* eslint-disable react-hooks/set-state-in-effect -- syncing dialog open/initialName into form state on each open */
    setName(initialName ?? '');
    setColor(initialColor ?? DEFAULT_MUSCLE_GROUP_COLOR);
    setNameError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialColor, initialName, open]);

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

    onSave(trimmed, color);
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
          sx={{ mb: 3 }}
          value={name}
        />
        <Typography
          gutterBottom
          variant="body2"
        >
          Colour
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
        >
          {MUSCLE_GROUP_PALETTE.map((swatch) => (
            <Tooltip
              key={swatch}
              title={swatch}
            >
              <Box
                aria-label={`Select colour ${swatch}`}
                component="button"
                onClick={() => setColor(swatch)}
                sx={{
                  alignItems: 'center',
                  aspectRatio: '1',
                  backgroundColor: swatch,
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  outline:
                    color === swatch
                      ? '3px solid'
                      : '2px solid transparent',
                  outlineColor:
                    color === swatch ? 'text.primary' : 'transparent',
                  outlineOffset: '2px',
                  padding: 0,
                  transition: 'outline 0.1s',
                  width: '100%',
                }}
              >
                {color === swatch && (
                  <CheckIcon
                    sx={{
                      color: '#fff',
                      filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.6))',
                      fontSize: 16,
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          ))}
        </Box>
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
