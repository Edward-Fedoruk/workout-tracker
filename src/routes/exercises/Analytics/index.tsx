import { AnalyticsView } from './views/AnalyticsView';
import { type Exercise, listExercises } from '@/database';
import { useEffect, useState } from 'react';

/**
 * Smart container for the Analytics tab. Loads the exercise list (for the US1
 * picker) and hands it to the presentational shell; each chart section owns its
 * own data via its hook.
 */
export const ExerciseAnalytics = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listExercises()
      .then((list) => setExercises(list))
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AnalyticsView
      exercises={exercises}
      isLoading={isLoading}
    />
  );
};
