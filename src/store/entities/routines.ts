import { api } from '../api';
import { runDatabaseQuery } from '../databaseQuery';
import {
  addRoutineExercise,
  createRoutine,
  deleteRoutine,
  deleteRoutineExercise,
  getRoutineById,
  listRoutines,
  moveRoutineExercise,
  reorderRoutineExercises,
  type RoutineWithExercises,
  setRoutineExerciseSetCount,
  updateRoutine,
  updateRoutineExercise,
} from '@/database';

type RoutineExerciseFields = {
  exerciseName: string;
  maxReps: number;
  minReps: number;
  suggestedSets: number;
};

const routinesApi = api.injectEndpoints({
  endpoints: (build) => ({
    addRoutineExercise: build.mutation<
      Awaited<ReturnType<typeof addRoutineExercise>>,
      RoutineExerciseFields & { routineId: number }
    >({
      invalidatesTags: ['Routine'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            addRoutineExercise(
              argument.routineId,
              argument.exerciseName,
              argument.suggestedSets,
              argument.minReps,
              argument.maxReps,
            ),
          'Failed to add exercise',
        ),
    }),
    createRoutine: build.mutation<
      Awaited<ReturnType<typeof createRoutine>>,
      string
    >({
      invalidatesTags: ['Routine'],
      queryFn: (name) =>
        runDatabaseQuery(() => createRoutine(name), 'Failed to create routine'),
    }),
    deleteRoutine: build.mutation<void, number>({
      invalidatesTags: ['Routine'],
      queryFn: (id) =>
        runDatabaseQuery(() => deleteRoutine(id), 'Failed to delete routine'),
    }),
    deleteRoutineExercise: build.mutation<
      void,
      { id: number; routineId: number }
    >({
      invalidatesTags: ['Routine'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () => deleteRoutineExercise(argument.id, argument.routineId),
          'Failed to delete exercise',
        ),
    }),
    getRoutine: build.query<Awaited<ReturnType<typeof getRoutineById>>, number>(
      {
        providesTags: (_result, _error, id) => [{ id, type: 'Routine' }],
        queryFn: (id) =>
          runDatabaseQuery(() => getRoutineById(id), 'Failed to load routine'),
      },
    ),
    listRoutines: build.query<RoutineWithExercises[], void>({
      providesTags: ['Routine'],
      queryFn: () =>
        runDatabaseQuery(() => listRoutines(), 'Failed to load routines'),
    }),
    moveRoutineExercise: build.mutation<
      void,
      { direction: 'down' | 'up'; id: number; routineId: number }
    >({
      invalidatesTags: ['Routine'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            moveRoutineExercise(
              argument.id,
              argument.routineId,
              argument.direction,
            ),
          'Failed to move exercise',
        ),
    }),
    reorderRoutineExercises: build.mutation<
      void,
      { orderedIds: number[]; routineId: number }
    >({
      invalidatesTags: ['Routine'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            reorderRoutineExercises(argument.routineId, argument.orderedIds),
          'Failed to reorder exercises',
        ),
    }),
    setRoutineExerciseSetCount: build.mutation<
      void,
      { id: number; suggestedSets: number }
    >({
      invalidatesTags: ['Routine'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () => setRoutineExerciseSetCount(argument.id, argument.suggestedSets),
          'Failed to update set count',
        ),
    }),
    updateRoutine: build.mutation<void, { id: number; name: string }>({
      invalidatesTags: ['Routine'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () => updateRoutine(argument.id, argument.name),
          'Failed to save routine',
        ),
    }),
    updateRoutineExercise: build.mutation<
      void,
      RoutineExerciseFields & { id: number }
    >({
      invalidatesTags: ['Routine'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            updateRoutineExercise(
              argument.id,
              argument.exerciseName,
              argument.suggestedSets,
              argument.minReps,
              argument.maxReps,
            ),
          'Failed to save exercise',
        ),
    }),
  }),
});

export const {
  useAddRoutineExerciseMutation,
  useCreateRoutineMutation,
  useDeleteRoutineExerciseMutation,
  useDeleteRoutineMutation,
  useGetRoutineQuery,
  useLazyGetRoutineQuery,
  useListRoutinesQuery,
  useMoveRoutineExerciseMutation,
  useReorderRoutineExercisesMutation,
  useSetRoutineExerciseSetCountMutation,
  useUpdateRoutineExerciseMutation,
  useUpdateRoutineMutation,
} = routinesApi;
