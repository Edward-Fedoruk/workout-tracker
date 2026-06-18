import { AppLayout } from './AppLayout';
import { ExerciseDetail } from './routes/exercises/Exercise/ExerciseDetail';
import { ExerciseLibrary } from './routes/exercises/ExerciseLibrary';
import { RoutineList } from './routes/routines/RoutineList';
import { RoutineWorkout } from './routes/routines/RoutineWorkout';
import { Settings } from './routes/settings';
import { Workouts } from './routes/workouts';
import { createHashRouter, Navigate } from 'react-router-dom';

export const router = createHashRouter([
  {
    children: [
      { element: <Workouts />, path: '/log' },
      { element: <RoutineList />, path: '/routines' },
      { element: <RoutineWorkout />, path: '/routines/:id' },
      { element: <ExerciseLibrary />, path: '/exercises' },
      { element: <ExerciseDetail />, path: '/exercises/:id' },
      { element: <Settings />, path: '/settings' },
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
]);
