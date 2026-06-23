import { api } from '../api';
import { runDatabaseQuery } from '../databaseQuery';
import {
  createMuscleGroup,
  deleteMuscleGroup,
  listMuscleGroups,
  type MuscleGroup,
  updateMuscleGroup,
} from '@/database';

const muscleGroupsApi = api.injectEndpoints({
  endpoints: (build) => ({
    createMuscleGroup: build.mutation<
      Awaited<ReturnType<typeof createMuscleGroup>>,
      { color: string; name: string }
    >({
      invalidatesTags: ['MuscleGroup', 'Exercise'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () => createMuscleGroup(argument.name, argument.color),
          'Failed to create muscle group',
        ),
    }),
    deleteMuscleGroup: build.mutation<void, number>({
      invalidatesTags: ['MuscleGroup', 'Exercise'],
      queryFn: (id) =>
        runDatabaseQuery(
          () => deleteMuscleGroup(id),
          'Failed to delete muscle group',
        ),
    }),
    listMuscleGroups: build.query<MuscleGroup[], void>({
      providesTags: ['MuscleGroup'],
      queryFn: () =>
        runDatabaseQuery(
          () => listMuscleGroups(),
          'Failed to load muscle groups',
        ),
    }),
    updateMuscleGroup: build.mutation<
      Awaited<ReturnType<typeof updateMuscleGroup>>,
      { color: string; id: number; name: string }
    >({
      invalidatesTags: ['MuscleGroup', 'Exercise'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () => updateMuscleGroup(argument.id, argument.name, argument.color),
          'Failed to save muscle group',
        ),
    }),
  }),
});

export const {
  useCreateMuscleGroupMutation,
  useDeleteMuscleGroupMutation,
  useListMuscleGroupsQuery,
  useUpdateMuscleGroupMutation,
} = muscleGroupsApi;
