import { useExercises } from './hooks/useExercises';
import { useMuscleGroups } from './hooks/useMuscleGroups';
import { ExerciseLibraryView, type SubView } from './views/ExerciseLibraryView';
import { ExercisesSubView } from './views/ExercisesSubView';
import { MuscleGroupsSubView } from './views/MuscleGroupsSubView';
import { ExerciseAnalytics } from '@/routes/exercises/Analytics';
import { useEffect, useState } from 'react';

export const ExerciseLibrary = () => {
  const [subView, setSubView] = useState<SubView>('exercises');
  const exercises = useExercises();
  const muscleGroups = useMuscleGroups();

  useEffect(() => {
    const load = async () => {
      await Promise.all([exercises.refresh(), muscleGroups.refresh()]);
    };

    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);

  return (
    <ExerciseLibraryView
      onAdd={
        subView === 'exercises' ? exercises.openCreate : muscleGroups.openCreate
      }
      onSubViewChange={setSubView}
      subView={subView}
    >
      {subView === 'exercises' && (
        <ExercisesSubView
          {...exercises}
          muscleGroups={muscleGroups.muscleGroups}
        />
      )}
      {subView === 'muscle-groups' && (
        <MuscleGroupsSubView
          {...muscleGroups}
          onAfterDelete={() => exercises.refresh()}
        />
      )}
      {subView === 'analytics' && <ExerciseAnalytics />}
    </ExerciseLibraryView>
  );
};
