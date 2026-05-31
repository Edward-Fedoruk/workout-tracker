import {
  deleteWorkout,
  getBodyWeight,
  getWorkoutById,
  listExercises,
  listWorkouts,
  type WorkoutTableRow,
  type WorkoutWithSets,
} from '../database';
import { type ExerciseClassification } from '../utils/erm';
import { DeleteWorkoutDialog } from './DeleteWorkoutDialog';
import { WorkoutDataActions } from './WorkoutDataActions';
import { WorkoutForm } from './WorkoutForm';
import { WorkoutRowActions } from './WorkoutRowActions';
import { HIDDEN_SET_COLUMNS, useSetColumns } from './WorkoutSetRow';
import { Box, Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
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
  const [bodyWeight, setBodyWeight] = useState<null | number>(null);
  const [classificationByName, setClassificationByName] = useState<
    Map<string, ExerciseClassification>
  >(new Map());

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [rows, weight, exercises] = await Promise.all([
        listWorkouts(),
        getBodyWeight(),
        listExercises(),
      ]);
      setWorkouts(rows);
      setBodyWeight(weight);
      setClassificationByName(
        new Map(
          exercises.map((exercise) => [exercise.name, exercise.classification]),
        ),
      );
    } catch {
      setLoadError('Failed to load workouts. Please reload the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line promise/prefer-await-to-then, react-hooks/set-state-in-effect -- fire-and-forget from sync useEffect callback; setState calls happen in async callback
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
    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync callback
    loadAll().catch(() => undefined);
  }, [loadAll]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
  }, []);

  const setColumns = useSetColumns({ bodyWeight, classificationByName });

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
          // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
          openEditForm(row.original.id).catch(() => undefined);
        }}
      />
    ),
    renderTopToolbarCustomActions: () => (
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
        <WorkoutDataActions />
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

      <DeleteWorkoutDialog
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
          handleDeleteConfirm().catch(() => undefined);
        }}
        open={confirmDeleteId !== null}
      />
    </Box>
  );
};
