import {
  useGetExerciseNamesInTablesQuery,
  useSetExerciseNamesInTablesMutation,
} from '@/store/entities/settings';

export type UseDisplaySettingsReturn = ReturnType<typeof useDisplaySettings>;

export const useDisplaySettings = () => {
  const { data, isLoading } = useGetExerciseNamesInTablesQuery();
  const [setExerciseNamesInTables] = useSetExerciseNamesInTablesMutation();

  const exerciseNamesInTables = data ?? false;

  // Cache invalidation keeps the value fresh; kept as a resolved no-op so the
  // view's mount-time call stays valid (HR-2).
  const refresh = async (): Promise<void> => undefined;

  const toggle = async () => {
    await setExerciseNamesInTables(!exerciseNamesInTables).unwrap();
  };

  return {
    exerciseNamesInTables,
    isLoading,
    refresh,
    toggle,
  };
};
