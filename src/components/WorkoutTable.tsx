import {
  deleteWorkout,
  getWorkoutById,
  listWorkouts,
  type WorkoutTableRow,
  type WorkoutWithSets,
} from '../database';
import { WorkoutDataActions } from './WorkoutDataActions';
import { WorkoutForm } from './WorkoutForm';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from 'material-react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

const renderNullable = (value: null | number) => value ?? '—';

export const WorkoutTable = () => {
  const [workouts, setWorkouts] = useState<WorkoutTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<null | WorkoutWithSets>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<null | number>(null);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const rows = await listWorkouts();
      setWorkouts(rows);
    } catch {
      setLoadError('Failed to load workouts. Please reload the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    loadWorkouts().catch(() => undefined);
  }, [loadWorkouts]);

  const openNewForm = useCallback(() => {
    setEditingWorkout(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback(async (id: number) => {
    const workout = await getWorkoutById(id);
    setEditingWorkout(workout);
    setShowForm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (confirmDeleteId === null) {
      return;
    }

    const idToDelete = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await deleteWorkout(idToDelete);
      await loadWorkouts();
    } catch {
      setLoadError('Failed to delete workout. Please try again.');
    }
  }, [confirmDeleteId, loadWorkouts]);

  const handleFormSave = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync callback
    loadWorkouts().catch(() => undefined);
  }, [loadWorkouts]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
  }, []);

  const columns = useMemo<Array<MRT_ColumnDef<WorkoutTableRow>>>(
    () => [
      { accessorKey: 'workout_date', header: 'Date', size: 110 },
      { accessorKey: 'exercise_name', header: 'Exercise', size: 200 },
      {
        accessorKey: 'Set1_weight',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S1 kg',
        size: 80,
      },
      {
        accessorKey: 'Set1_reps',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S1 reps',
        size: 80,
      },
      {
        accessorKey: 'Set2_weight',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S2 kg',
        size: 80,
      },
      {
        accessorKey: 'Set2_reps',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S2 reps',
        size: 80,
      },
      {
        accessorKey: 'Set3_weight',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S3 kg',
        size: 80,
      },
      {
        accessorKey: 'Set3_reps',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S3 reps',
        size: 80,
      },
      {
        accessorKey: 'Set4_weight',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S4 kg',
        size: 80,
      },
      {
        accessorKey: 'Set4_reps',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S4 reps',
        size: 80,
      },
      {
        accessorKey: 'Set5_weight',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S5 kg',
        size: 80,
      },
      {
        accessorKey: 'Set5_reps',
        Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
        header: 'S5 reps',
        size: 80,
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: workouts,
    enableRowActions: true,
    initialState: {
      columnVisibility: {
        Set2_reps: false,
        Set2_weight: false,
        Set3_reps: false,
        Set3_weight: false,
        Set4_reps: false,
        Set4_weight: false,
        Set5_reps: false,
        Set5_weight: false,
      },
    },
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          onClick={() => {
            // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
            openEditForm(row.original.id).catch(() => undefined);
          }}
          size="small"
          variant="outlined"
        >
          Edit
        </Button>
        <Button
          color="error"
          onClick={() => {
            setConfirmDeleteId(row.original.id);
          }}
          size="small"
          variant="outlined"
        >
          Delete
        </Button>
      </Box>
    ),
    renderTopToolbarCustomActions: () => (
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
        <WorkoutDataActions />
        <Button
          onClick={openNewForm}
          variant="contained"
        >
          Add Workout
        </Button>
      </Box>
    ),
    state: {
      isLoading,
      showAlertBanner: loadError !== null,
    },
    ...(loadError !== null
      ? {
          muiToolbarAlertBannerProps: {
            children: loadError,
            severity: 'error' as const,
          },
        }
      : {}),
  });

  return (
    <Box sx={{ maxWidth: 1_200, mx: 'auto', p: 2 }}>
      <MaterialReactTable table={table} />

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={handleFormCancel}
        open={showForm}
      >
        <DialogTitle>
          {editingWorkout ? 'Edit Workout' : 'Add Workout'}
        </DialogTitle>
        <DialogContent>
          <WorkoutForm
            onCancel={handleFormCancel}
            onSave={handleFormSave}
            {...(editingWorkout ? { initialData: editingWorkout } : {})}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        onClose={() => {
          setConfirmDeleteId(null);
        }}
        open={confirmDeleteId !== null}
      >
        <DialogTitle>Delete Workout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this workout? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDeleteId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
              handleDeleteConfirm().catch(() => undefined);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
