import { AppLayout } from './AppLayout';
import { ExerciseLibrary } from './routes/exercises/ExerciseLibrary';
import { RoutineEditor } from './routes/routines/RoutineEditor';
import { RoutineList } from './routes/routines/RoutineList';
import { RoutineWorkoutForm } from './routes/routines/RoutineWorkoutForm';
import { SettingsPage } from './routes/settings/SettingsPage';
import { WorkoutTable } from './routes/workouts/WorkoutTable';
import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter(
  [
    {
      children: [
        { element: <WorkoutTable />, path: '/log' },
        { element: <RoutineList />, path: '/routines' },
        { element: <RoutineEditor />, path: '/routines/new' },
        { element: <RoutineEditor />, path: '/routines/:id/edit' },
        { element: <RoutineWorkoutForm />, path: '/routines/:id/start' },
        { element: <ExerciseLibrary />, path: '/exercises' },
        { element: <SettingsPage />, path: '/settings' },
        {
          element: (
            <Navigate
              replace
              to="/log"
            />
          ),
          path: '/',
        },
        {
          element: (
            <Navigate
              replace
              to="/log"
            />
          ),
          path: '*',
        },
      ],
      element: <AppLayout />,
    },
  ],
  { basename: '/workout-tracker' },
);
