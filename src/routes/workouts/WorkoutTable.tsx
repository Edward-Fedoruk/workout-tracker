import { FormDialog } from '../../components';
import {
  deleteWorkout,
  getWorkoutById,
  listWorkouts,
  type WorkoutTableRow,
  type WorkoutWithSets,
} from '../../database';
import { DeleteWorkoutDialog } from './DeleteWorkoutDialog';
import { WorkoutForm } from './WorkoutForm';
import { WorkoutRowActions } from './WorkoutRowActions';
import { HIDDEN_SET_COLUMNS, useSetColumns } from './WorkoutSetRow';
import { Box, Button } from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from 'material-react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const WorkoutTable = () => {
  const [workouts, setWorkouts] = useState<WorkoutTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<null | WorkoutWithSets>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<null | number>(null);

  const loadAll = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState calls happen in async callback
    loadAll().catch(() => undefined);
  }, [loadAll]);

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
      await loadAll();
    } catch {
      setLoadError('Failed to delete workout. Please try again.');
    }
  }, [confirmDeleteId, loadAll]);

  const handleFormSave = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
    loadAll().catch(() => undefined);
  }, [loadAll]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
  }, []);

  const setColumns = useSetColumns();

  const columns = useMemo<Array<MRT_ColumnDef<WorkoutTableRow>>>(
    () => [
      { accessorKey: 'workout_date', header: 'Date', size: 110 },
      { accessorKey: 'exercise_name', header: 'Exercise', size: 200 },
      ...setColumns,
    ],
    [setColumns],
  );

  const table = useMaterialReactTable({
    columns,
    data: workouts,
    enableRowActions: true,
    initialState: { columnVisibility: HIDDEN_SET_COLUMNS },
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <WorkoutRowActions
        onDelete={() => setConfirmDeleteId(row.original.id)}
        onEdit={() => {
          openEditForm(row.original.id).catch(() => undefined);
        }}
      />
    ),
    renderTopToolbarCustomActions: () => (
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
        <Button
          onClick={() => {
            setEditingWorkout(null);
            setShowForm(true);
          }}
          variant="contained"
        >
          Add Workout
        </Button>
      </Box>
    ),
    state: { isLoading, showAlertBanner: loadError !== null },
    ...(loadError === null
      ? {}
      : {
          muiToolbarAlertBannerProps: {
            children: loadError,
            severity: 'error' as const,
          },
        }),
  });

  return (
    <Box sx={{ maxWidth: 1_200, mx: 'auto', padding: 2 }}>
      <MaterialReactTable table={table} />

      <FormDialog
        maxWidth="sm"
        onClose={handleFormCancel}
        open={showForm}
        title={editingWorkout ? 'Edit Workout' : 'Add Workout'}
      >
        <WorkoutForm
          onCancel={handleFormCancel}
          onSave={handleFormSave}
          {...(editingWorkout ? { initialData: editingWorkout } : {})}
        />
      </FormDialog>

      <DeleteWorkoutDialog
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          handleDeleteConfirm().catch(() => undefined);
        }}
        open={confirmDeleteId !== null}
      />
    </Box>
  );
};
