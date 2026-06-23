import { useGetDraftQuery } from '@/store/entities/draft';
import {
  useCreateRoutineMutation,
  useDeleteRoutineMutation,
  useListRoutinesQuery,
} from '@/store/entities/routines';

export type UseRoutinesReturn = ReturnType<typeof useRoutines>;

export const useRoutines = () => {
  const { data: routines = [] } = useListRoutinesQuery();
  const { data: draft } = useGetDraftQuery();
  const [createRoutine] = useCreateRoutineMutation();
  const [deleteRoutine] = useDeleteRoutineMutation();

  const draftRoutineId = draft ? draft.routineId : null;

  // Cache invalidation keeps the list fresh; kept as a resolved no-op so the
  // view's mount-time call stays valid (HR-2).
  const refresh = async (): Promise<void> => undefined;

  const create = async (): Promise<number> =>
    createRoutine('New routine').unwrap();

  const remove = async (id: number): Promise<void> => {
    await deleteRoutine(id).unwrap();
  };

  return {
    create,
    draftRoutineId,
    refresh,
    remove,
    routines,
  };
};
