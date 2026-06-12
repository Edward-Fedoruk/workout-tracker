import { Logo } from '@/components/SplashScreen';
import { RoutineCard } from '@/routes/routines/RoutineCard';
import { type UseRoutinesReturn } from '@/routes/routines/RoutineList/hooks/useRoutines';
import AddIcon from '@mui/icons-material/Add';
import { Box, Fab, Typography } from '@mui/material';

export type RoutineListViewProps = UseRoutinesReturn & {
  readonly onAdd: () => void;
  readonly onEdit: (id: number) => void;
  readonly onStart: (id: number) => void;
};

export const RoutineListView = ({
  draftRoutineId,
  onAdd,
  onEdit,
  onStart,
  routines,
}: RoutineListViewProps) => (
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
          onEdit={() => onEdit(routine.id)}
          onStart={() => onStart(routine.id)}
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
  </Box>
);
