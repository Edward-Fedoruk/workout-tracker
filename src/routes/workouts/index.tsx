import { useWorkouts } from './hooks/useWorkouts';
import { WorkoutsView } from './views/WorkoutsView';
import { useEffect } from 'react';

export const Workouts = () => {
  const workouts = useWorkouts();

  useEffect(() => {
    workouts.refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);

  return <WorkoutsView {...workouts} />;
};
