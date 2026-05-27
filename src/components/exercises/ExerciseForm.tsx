import { type MuscleGroup } from '../../database';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';

export type ExerciseFormInitial = {
  muscleGroupIds: number[];
  name: string;
};

type Props = {
  readonly duplicateError?: null | string | undefined;
  readonly initialValues?: ExerciseFormInitial | undefined;
  readonly mode: 'create' | 'edit';
  readonly muscleGroups: MuscleGroup[];
  readonly onCancel: () => void;
  readonly onSave: (name: string, muscleGroupIds: number[]) => void;
  readonly open: boolean;
};

export const ExerciseForm = ({
  duplicateError,
  initialValues,
  mode,
  muscleGroups,
  onCancel,
  onSave,
  open,
}: Props) => {
  const [name, setName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>([]);
  const [nameError, setNameError] = useState<null | string>(null);
  const [groupsError, setGroupsError] = useState<null | string>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    /* eslint-disable react-hooks/set-state-in-effect -- syncing dialog open/initialValues into form state on each open */
    setName(initialValues?.name ?? '');
    setSelectedGroups(
      initialValues
        ? muscleGroups.filter((group) =>
            initialValues.muscleGroupIds.includes(group.id),
          )
        : [],
    );
    setNameError(null);
    setGroupsError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialValues, muscleGroups, open]);

  const handleSave = () => {
    const trimmed = name.trim();
    let hasError = false;

    if (trimmed.length === 0) {
      setNameError('Name is required');
      hasError = true;
    } else if (trimmed.length > 100) {
      setNameError('Name must be 100 characters or fewer');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (selectedGroups.length === 0) {
      setGroupsError('Select at least one muscle group');
      hasError = true;
    } else {
      setGroupsError(null);
    }

    if (hasError) {
      return;
    }

    onSave(
      trimmed,
      selectedGroups.map((group) => group.id),
    );
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={onCancel}
      open={open}
    >
      <DialogTitle>
        {mode === 'create' ? 'Add Exercise' : 'Edit Exercise'}
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: '16px !important',
        }}
      >
        <Stack spacing={2}>
          <TextField
            autoFocus
            error={Boolean(nameError) || Boolean(duplicateError)}
            fullWidth
            helperText={nameError ?? duplicateError ?? ''}
            label="Exercise name"
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
            value={name}
          />
          <Autocomplete
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            multiple
            onChange={(_event, next) => {
              setSelectedGroups(next);
              setGroupsError(null);
            }}
            options={muscleGroups}
            renderInput={(parameters) => (
              <TextField
                {...parameters}
                error={Boolean(groupsError)}
                helperText={groupsError ?? ''}
                label="Muscle groups"
              />
            )}
            value={selectedGroups}
          />
        </Stack>
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
