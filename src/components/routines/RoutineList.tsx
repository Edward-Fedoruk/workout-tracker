import {
  deleteRoutine,
  listRoutines,
  type RoutineWithExercises,
} from '../../database';
import { RoutineCard } from './RoutineCard';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

type Props = {
  readonly onAdd: () => void;
  readonly onEdit: (routineId: number) => void;
  readonly onStart: (routineId: number) => void;
};

export const RoutineList = ({ onAdd, onEdit, onStart }: Props) => {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<null | number>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listRoutines();
    setRoutines(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await load();
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    initialize().catch(() => undefined);
  }, [load]);

  const handleDeleteConfirm = async () => {
    if (deleteId === null) {
      return;
    }

    await deleteRoutine(deleteId);
    setDeleteId(null);
    await load();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h5">Routines</Typography>
        <Button
          onClick={onAdd}
          variant="contained"
        >
          Add Routine
        </Button>
      </Box>

      {routines.length === 0 ? (
        <Typography color="text.secondary">
          No routines yet. Create one to get started.
        </Typography>
      ) : (
        routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            onDelete={() => setDeleteId(routine.id)}
            onEdit={() => onEdit(routine.id)}
            onStart={() => onStart(routine.id)}
            routine={routine}
          />
        ))
      )}

      <Dialog
        onClose={() => setDeleteId(null)}
        open={deleteId !== null}
      >
        <DialogTitle>Delete Routine</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete &ldquo;
            {routines.find((routine) => routine.id === deleteId)?.name}
            &rdquo;? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={async () => handleDeleteConfirm()}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
