import { FormDialog } from '../../../components';
import { type WorkoutTableRow } from '../../../database';
import { DeleteWorkoutDialog } from '../DeleteWorkoutDialog';
import { type UseWorkoutsReturn } from '../hooks/useWorkouts';
import { WorkoutForm } from '../WorkoutForm';
import { WorkoutRowActions } from '../WorkoutRowActions';
import { HIDDEN_SET_COLUMNS, useSetColumns } from '../WorkoutSetRow';
import { Box, Button } from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from 'material-react-table';
import { useMemo } from 'react';

export type WorkoutsViewProps = UseWorkoutsReturn;

export const WorkoutsView = ({
  bodyWeight,
  cancelDelete,
  confirmDelete,
  deleteConfirm,
  editingWorkout,
  exercises,
  formDialog,
  handleCancelForm,
  handleSave,
  isLoading,
  loadError,
  openCreate,
  openEdit,
  requestDelete,
  workouts,
}: WorkoutsViewProps) => {
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
        onDelete={() => requestDelete(row.original.id)}
        onEdit={() => {
          openEdit(row.original.id).catch(() => undefined);
        }}
      />
    ),
    renderTopToolbarCustomActions: () => (
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
        <Button
          onClick={openCreate}
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
        onClose={handleCancelForm}
        open={formDialog.isOpen}
        title={editingWorkout ? 'Edit Workout' : 'Add Workout'}
      >
        <WorkoutForm
          bodyWeight={bodyWeight}
          exercises={exercises}
          onCancel={handleCancelForm}
          onSave={handleSave}
          {...(editingWorkout ? { initialData: editingWorkout } : {})}
        />
      </FormDialog>

      <DeleteWorkoutDialog
        onCancel={cancelDelete}
        onConfirm={() => {
          confirmDelete().catch(() => undefined);
        }}
        open={deleteConfirm.isOpen}
      />
    </Box>
  );
};
