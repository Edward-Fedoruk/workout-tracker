import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Logo } from '@/components/SplashScreen';
import { useToggle } from '@/hooks/useToggle';
import { RoutineCard } from '@/routes/routines/RoutineCard';
import { type UseRoutinesReturn } from '@/routes/routines/RoutineList/hooks/useRoutines';
import AddIcon from '@mui/icons-material/Add';
import { Box, Fab, Typography } from '@mui/material';
import { useState } from 'react';

export type RoutineListViewProps = UseRoutinesReturn & {
  readonly onAdd: () => void;
  readonly onDelete: (id: number) => void;
  readonly onOpen: (id: number) => void;
};

export const RoutineListView = ({
  draftRoutineId,
  onAdd,
  onDelete,
  onOpen,
  routines,
}: RoutineListViewProps) => {
  const deleteConfirm = useToggle();
  const [pendingDelete, setPendingDelete] = useState<null | number>(null);

  const pendingName = routines.find(
    (routine) => routine.id === pendingDelete,
  )?.name;

  return (
    <Box sx={{ padding: 2 }}>
      <Typography
        component="h1"
        sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2 }}
        variant="h6"
      >
        <Logo
          height={33}
          width={33}
        />
        Routines
      </Typography>

      {routines.length === 0 ? (
        <Typography color="text.secondary">
          No routines yet. Create one to get started.
        </Typography>
      ) : (
        routines.map((routine) => (
          <RoutineCard
            isInProgress={routine.id === draftRoutineId}
            key={routine.id}
            onDelete={() => {
              setPendingDelete(routine.id);
              deleteConfirm.onOpen();
            }}
            onOpen={() => onOpen(routine.id)}
            routine={routine}
          />
        ))
      )}

      <Fab
        aria-label="add routine"
        color="secondary"
        onClick={onAdd}
        sx={{ bottom: 80, position: 'fixed', right: 24 }}
      >
        <AddIcon />
      </Fab>

      <ConfirmDialog
        confirmColor="error"
        confirmLabel="Delete"
        onCancel={() => {
          setPendingDelete(null);
          deleteConfirm.onClose();
        }}
        onConfirm={() => {
          if (pendingDelete !== null) {
            onDelete(pendingDelete);
          }

          setPendingDelete(null);
          deleteConfirm.onClose();
        }}
        open={deleteConfirm.isOpen}
        title="Delete Routine"
      >
        Delete &ldquo;{pendingName}&rdquo;? This cannot be undone.
      </ConfirmDialog>
    </Box>
  );
};
