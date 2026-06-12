import { useRoutineWorkout } from './hooks/useRoutineWorkout';
import { RoutineWorkoutView } from './views/RoutineWorkoutView';
import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const RoutineWorkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routineId = id === undefined ? Number.NaN : Number.parseInt(id, 10);
  const workout = useRoutineWorkout();

  useEffect(() => {
    if (Number.isNaN(routineId)) {
      navigate('/routines', { replace: true });
      return;
    }

    const init = async () => {
      const found = await workout.load(routineId);
      if (!found) {
        navigate('/routines', { replace: true });
      }
    };

    init().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);

  if (workout.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!workout.routine) {
    return null;
  }

  return (
    <RoutineWorkoutView
      bodyWeight={workout.bodyWeight}
      draftData={workout.draftData}
      error={workout.error}
      exerciseImageMap={workout.exerciseImageMap}
      exercises={workout.exercises}
      isSubmitting={workout.isSubmitting}
      onAutoSave={(values) => workout.autoSave(values)}
      onBack={() => navigate('/routines')}
      onDiscard={() => {
        const discard = async () => {
          await workout.discardDraft();
          navigate('/routines');
        };

        discard().catch(() => undefined);
      }}
      onSubmit={async (values) => {
        const ok = await workout.submit(values);
        if (ok) {
          navigate('/log');
        }
      }}
      prefills={workout.prefills}
      routine={workout.routine}
    />
  );
};
