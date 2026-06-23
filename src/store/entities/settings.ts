import { api } from '../api';
import { runDatabaseQuery } from '../databaseQuery';
import {
  getBodyWeight,
  getExerciseNamesInTables,
  setBodyWeight,
  setExerciseNamesInTables,
} from '@/database';

const settingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBodyWeight: build.query<Awaited<ReturnType<typeof getBodyWeight>>, void>(
      {
        providesTags: ['Settings'],
        queryFn: () =>
          runDatabaseQuery(() => getBodyWeight(), 'Failed to load body weight'),
      },
    ),
    getExerciseNamesInTables: build.query<
      Awaited<ReturnType<typeof getExerciseNamesInTables>>,
      void
    >({
      providesTags: ['Settings'],
      queryFn: () =>
        runDatabaseQuery(
          () => getExerciseNamesInTables(),
          'Failed to load display settings',
        ),
    }),
    setBodyWeight: build.mutation<
      Awaited<ReturnType<typeof setBodyWeight>>,
      number
    >({
      // eRM is derived from body weight, so a change must refresh workout-backed
      // views too (contracts/store-api.md).
      invalidatesTags: ['Settings', 'Workout'],
      queryFn: (kg) =>
        runDatabaseQuery(() => setBodyWeight(kg), 'Failed to save body weight'),
    }),
    setExerciseNamesInTables: build.mutation<
      Awaited<ReturnType<typeof setExerciseNamesInTables>>,
      boolean
    >({
      invalidatesTags: ['Settings'],
      queryFn: (enabled) =>
        runDatabaseQuery(
          () => setExerciseNamesInTables(enabled),
          'Failed to save display settings',
        ),
    }),
  }),
});

export const {
  useGetBodyWeightQuery,
  useGetExerciseNamesInTablesQuery,
  useSetBodyWeightMutation,
  useSetExerciseNamesInTablesMutation,
} = settingsApi;
