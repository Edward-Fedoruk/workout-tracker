import { type WorkoutTableRow } from '@/database';
import { WorkoutRowActions } from '@/routes/workouts/WorkoutRowActions';
import {
  HIDDEN_SET_COLUMNS,
  useSetColumns,
} from '@/routes/workouts/WorkoutSetRow';
import { Box } from '@mui/material';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  useMaterialReactTable,
} from 'material-react-table';
import { useMemo } from 'react';

type Props = {
  readonly onDelete: (id: number) => void;
  readonly onEdit: (id: number) => void;
  readonly workouts: WorkoutTableRow[];
};

export const AdvancedWorkoutTable = ({ onDelete, onEdit, workouts }: Props) => {
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
    enableFullScreenToggle: false,
    enableRowActions: true,
    initialState: { columnVisibility: HIDDEN_SET_COLUMNS },
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <WorkoutRowActions
        onDelete={() => onDelete(row.original.id)}
        onEdit={() => {
          onEdit(row.original.id);
        }}
      />
    ),
  });

  return (
    <Box sx={{ pt: 'max(env(safe-area-inset-top), 16px)' }}>
      <MaterialReactTable table={table} />
    </Box>
  );
};
