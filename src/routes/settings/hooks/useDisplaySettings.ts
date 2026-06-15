import { getExerciseNamesInTables, setExerciseNamesInTables } from '@/database';
import { useState } from 'react';

export type UseDisplaySettingsReturn = ReturnType<typeof useDisplaySettings>;

export const useDisplaySettings = () => {
  const [exerciseNamesInTables, setExerciseNamesInTablesState] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const value = await getExerciseNamesInTables();
      setExerciseNamesInTablesState(value);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle = async () => {
    const next = !exerciseNamesInTables;
    setExerciseNamesInTablesState(next);
    await setExerciseNamesInTables(next);
  };

  return {
    exerciseNamesInTables,
    isLoading,
    refresh,
    toggle,
  };
};
