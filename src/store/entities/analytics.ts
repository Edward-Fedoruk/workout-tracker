import { api } from '../api';
import { runDatabaseQuery } from '../databaseQuery';
import {
  type AnalyticsMuscleGroupSetRow,
  type AnalyticsSetRow,
  listMuscleGroupSetRowsInRange,
  listSetRowsInRange,
} from '@/database';

type RangeArgument = {
  endIso: string;
  startIso: string;
};

const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMuscleGroupSetRowsInRange: build.query<
      AnalyticsMuscleGroupSetRow[],
      RangeArgument
    >({
      // Shares Workout/MuscleGroup so logging or recolouring refreshes the rose.
      providesTags: ['Workout', 'MuscleGroup'],
      queryFn: ({ endIso, startIso }) =>
        runDatabaseQuery(
          () => listMuscleGroupSetRowsInRange(startIso, endIso),
          'Failed to load analytics',
        ),
    }),
    listSetRowsInRange: build.query<AnalyticsSetRow[], RangeArgument>({
      // Derived view: shares Workout/Exercise/Settings so source edits (logs,
      // renames, body weight) refresh it via tags (FR-013).
      providesTags: ['Workout', 'Exercise', 'Settings'],
      queryFn: ({ endIso, startIso }) =>
        runDatabaseQuery(
          () => listSetRowsInRange(startIso, endIso),
          'Failed to load analytics',
        ),
    }),
  }),
});

export const {
  useListMuscleGroupSetRowsInRangeQuery,
  useListSetRowsInRangeQuery,
} = analyticsApi;
