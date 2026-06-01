import { useRoutines } from './hooks/useRoutines';
import { RoutineListView } from './views/RoutineListView';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const RoutineList = () => {
  const navigate = useNavigate();
  const routines = useRoutines();

  useEffect(() => {
    const load = async () => {
      await routines.refresh();
    };

    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);

  return (
    <RoutineListView
      {...routines}
      onAdd={() => navigate('/routines/new')}
      onEdit={(id) => navigate(`/routines/${id}/edit`)}
      onStart={(id) => navigate(`/routines/${id}/start`)}
    />
  );
};
