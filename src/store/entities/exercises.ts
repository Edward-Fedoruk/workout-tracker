import { api } from '../api';
import { runDatabaseQuery } from '../databaseQuery';
import {
  createExercise,
  deleteExercise,
  type Exercise,
  type ExerciseClassification,
  getExerciseById,
  listExercises,
  updateExercise,
} from '@/database';

type CreateExerciseArgument = {
  classification: ExerciseClassification;
  imageFilename?: null | string;
  muscleGroupIds: number[];
  name: string;
};

type UpdateExerciseArgument = CreateExerciseArgument & { id: number };

const exercisesApi = api.injectEndpoints({
  endpoints: (build) => ({
    createExercise: build.mutation<
      Awaited<ReturnType<typeof createExercise>>,
      CreateExerciseArgument
    >({
      invalidatesTags: ['Exercise'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            createExercise(
              argument.name,
              argument.muscleGroupIds,
              argument.classification,
              argument.imageFilename ?? null,
            ),
          'Failed to create exercise',
        ),
    }),
    deleteExercise: build.mutation<void, number>({
      invalidatesTags: ['Exercise'],
      queryFn: (id) =>
        runDatabaseQuery(() => deleteExercise(id), 'Failed to delete exercise'),
    }),
    getExercise: build.query<
      Awaited<ReturnType<typeof getExerciseById>>,
      number
    >({
      providesTags: (_result, _error, id) => [{ id, type: 'Exercise' }],
      queryFn: (id) =>
        runDatabaseQuery(() => getExerciseById(id), 'Failed to load exercise'),
    }),
    listExercises: build.query<Exercise[], void>({
      providesTags: ['Exercise'],
      queryFn: () =>
        runDatabaseQuery(() => listExercises(), 'Failed to load exercises'),
    }),
    updateExercise: build.mutation<
      Awaited<ReturnType<typeof updateExercise>>,
      UpdateExerciseArgument
    >({
      // Exercise names are denormalized into workout rows, so an edit must also
      // refresh the workout cache (contracts/store-api.md).
      invalidatesTags: ['Exercise', 'Workout'],
      queryFn: (argument) =>
        runDatabaseQuery(
          () =>
            updateExercise(
              argument.id,
              argument.name,
              argument.muscleGroupIds,
              argument.classification,
              argument.imageFilename ?? null,
            ),
          'Failed to save exercise',
        ),
    }),
  }),
});

export const {
  useCreateExerciseMutation,
  useDeleteExerciseMutation,
  useGetExerciseQuery,
  useListExercisesQuery,
  useUpdateExerciseMutation,
} = exercisesApi;
