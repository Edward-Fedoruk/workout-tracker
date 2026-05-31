import { ConfirmDialog } from '../../components';
import {
  deleteRoutine,
  listRoutines,
  type RoutineWithExercises,
} from '../../database';
import { RoutineCard } from './RoutineCard';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const RoutineList = () => {
  const navigate = useNavigate();
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
          onClick={() => navigate('/routines/new')}
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
            onEdit={() => navigate(`/routines/${routine.id}/edit`)}
            onStart={() => navigate(`/routines/${routine.id}/start`)}
            routine={routine}
          />
        ))
      )}

      <ConfirmDialog
        confirmColor="error"
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => handleDeleteConfirm().catch(() => undefined)}
        open={deleteId !== null}
        title="Delete Routine"
      >
        Delete &ldquo;
        {routines.find((routine) => routine.id === deleteId)?.name}
        &rdquo;? This cannot be undone.
      </ConfirmDialog>
    </Box>
  );
};
