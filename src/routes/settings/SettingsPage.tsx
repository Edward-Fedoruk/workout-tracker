import { getBodyWeight, setBodyWeight } from '../../database';
import { DatabaseActions } from './DatabaseActions';
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

type Feedback = {
  message: string;
  severity: 'error' | 'success';
};

export const SettingsPage = () => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await getBodyWeight();
        setInputValue(stored === null ? '' : stored.toFixed(2));
      } finally {
        setIsLoading(false);
      }
    };

    load().catch(() => undefined);
  }, []);

  const handleSave = async () => {
    setFeedback(null);
    const trimmed = inputValue.trim();
    if (trimmed === '') {
      setFeedback({ message: 'Enter your body weight', severity: 'error' });
      return;
    }

    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed)) {
      setFeedback({
        message: 'Body weight must be a finite number',
        severity: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      await setBodyWeight(parsed);
      setInputValue(parsed.toFixed(2));
      setFeedback({ message: 'Body weight saved', severity: 'success' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save body weight';
      setFeedback({ message, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', padding: 2 }}>
      <Typography
        sx={{ mb: 2 }}
        variant="h5"
      >
        Settings
      </Typography>

      <Stack spacing={2}>
        <Typography variant="subtitle1">Body weight</Typography>
        <TextField
          disabled={isLoading || isSaving}
          fullWidth
          helperText="Used to compute eRM for body-weight and assisted exercises."
          inputMode="decimal"
          label="Body weight (kg)"
          onChange={(event) => {
            setInputValue(event.target.value);
            setFeedback(null);
          }}
          slotProps={{ htmlInput: { min: '0.01', step: '0.01' } }}
          type="number"
          value={inputValue}
        />

        {feedback !== null && (
          <Alert severity={feedback.severity}>{feedback.message}</Alert>
        )}

        <Box>
          <Button
            disabled={isLoading || isSaving}
            onClick={() => {
              handleSave().catch(() => undefined);
            }}
            sx={{ minHeight: 44, minWidth: 96 }}
            variant="contained"
          >
            Save
          </Button>
        </Box>

        <Divider />

        <Typography variant="subtitle1">Data</Typography>
        <Typography
          color="text.secondary"
          variant="body2"
        >
          Export your database as a backup or import a previously exported file.
          Importing will replace all current data.
        </Typography>
        <DatabaseActions />
      </Stack>
    </Box>
  );
};
