import { api } from '../api';
import { runDatabaseQuery } from '../databaseQuery';
import {
  clearDraft,
  getDraft,
  saveDraft,
  type StoredDraftData,
} from '@/database';

const draftApi = api.injectEndpoints({
  endpoints: (build) => ({
    clearDraft: build.mutation<void, void>({
      invalidatesTags: ['Draft'],
      queryFn: () =>
        runDatabaseQuery(() => clearDraft(), 'Failed to clear draft'),
    }),
    getDraft: build.query<Awaited<ReturnType<typeof getDraft>>, void>({
      providesTags: ['Draft'],
      queryFn: () => runDatabaseQuery(() => getDraft(), 'Failed to load draft'),
    }),
    saveDraft: build.mutation<
      Awaited<ReturnType<typeof saveDraft>>,
      { data: StoredDraftData; routineId: number }
    >({
      invalidatesTags: ['Draft'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () => saveDraft(argument.routineId, argument.data),
          'Failed to save draft',
        ),
    }),
  }),
});

export const {
  useClearDraftMutation,
  useGetDraftQuery,
  useLazyGetDraftQuery,
  useSaveDraftMutation,
} = draftApi;
