import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { RoutineCard } from '../../RoutineCard';
import { type UseRoutinesReturn } from '../hooks/useRoutines';
import { Box, Button, Typography } from '@mui/material';

export type RoutineListViewProps = UseRoutinesReturn & {
  readonly onAdd: () => void;
  readonly onEdit: (id: number) => void;
  readonly onStart: (id: number) => void;
};

export const RoutineListView = ({
  cancelDelete,
  deleteConfirm,
  handleConfirmDelete,
  onAdd,
  onEdit,
  onStart,
  pendingDelete,
  requestDelete,
  routines,
}: RoutineListViewProps) => (
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
          onDelete={() => requestDelete(routine)}
          onEdit={() => onEdit(routine.id)}
          onStart={() => onStart(routine.id)}
          routine={routine}
        />
      ))
    )}

    <ConfirmDialog
      confirmColor="error"
      confirmLabel="Delete"
      onCancel={cancelDelete}
      onConfirm={() => {
        handleConfirmDelete().catch(() => undefined);
      }}
      open={deleteConfirm.isOpen}
      title="Delete Routine"
    >
      Delete &ldquo;{pendingDelete?.name}&rdquo;? This cannot be undone.
    </ConfirmDialog>
  </Box>
);
