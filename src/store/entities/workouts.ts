import { api } from '../api';
import { runDatabaseQuery } from '../databaseQuery';
import {
  createWorkout,
  deleteWorkout,
  getWorkoutById,
  listWorkouts,
  listWorkoutsByExerciseName,
  updateWorkout,
} from '@/database';

type CreateWorkoutArgument = {
  exerciseName: string;
  sets: WorkoutSets;
  workoutDate: string;
};

type UpdateWorkoutArgument = CreateWorkoutArgument & { id: number };

type WorkoutSets = Parameters<typeof createWorkout>[2];

const workoutsApi = api.injectEndpoints({
  endpoints: (build) => ({
    createWorkout: build.mutation<
      Awaited<ReturnType<typeof createWorkout>>,
      CreateWorkoutArgument
    >({
      invalidatesTags: ['Workout'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            createWorkout(
              argument.workoutDate,
              argument.exerciseName,
              argument.sets,
            ),
          'Failed to save workout',
        ),
    }),
    deleteWorkout: build.mutation<void, number>({
      invalidatesTags: ['Workout'],
      queryFn: (id) =>
        runDatabaseQuery(() => deleteWorkout(id), 'Failed to delete workout'),
    }),
    getWorkout: build.query<Awaited<ReturnType<typeof getWorkoutById>>, number>(
      {
        providesTags: (_result, _error, id) => [{ id, type: 'Workout' }],
        queryFn: (id) =>
          runDatabaseQuery(() => getWorkoutById(id), 'Failed to load workout'),
      },
    ),
    listWorkouts: build.query<Awaited<ReturnType<typeof listWorkouts>>, void>({
      providesTags: ['Workout'],
      queryFn: () =>
        runDatabaseQuery(() => listWorkouts(), 'Failed to load workouts'),
    }),
    listWorkoutsByExerciseName: build.query<
      Awaited<ReturnType<typeof listWorkoutsByExerciseName>>,
      string
    >({
      providesTags: ['Workout'],
      queryFn: (name) =>
        runDatabaseQuery(
          () => listWorkoutsByExerciseName(name),
          'Failed to load workout history',
        ),
    }),
    updateWorkout: build.mutation<
      Awaited<ReturnType<typeof updateWorkout>>,
      UpdateWorkoutArgument
    >({
      invalidatesTags: ['Workout'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            updateWorkout(
              argument.id,
              argument.workoutDate,
              argument.exerciseName,
              argument.sets,
            ),
          'Failed to save workout',
        ),
    }),
  }),
});

export const {
  useCreateWorkoutMutation,
  useDeleteWorkoutMutation,
  useGetWorkoutQuery,
  useLazyGetWorkoutQuery,
  useListWorkoutsByExerciseNameQuery,
  useListWorkoutsQuery,
  useUpdateWorkoutMutation,
} = workoutsApi;
