import { type WorkoutTableRow } from '../database';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

const renderNullable = (value: null | number) => value ?? '—';

const formatERM = (value: null | number): string => {
  if (value === null) {
    return '—';
  }

  return value.toFixed(1);
};

const buildSetColumns = (
  setNumber: number,
): Array<MRT_ColumnDef<WorkoutTableRow>> => {
  const weightKey = `Set${setNumber}_weight` as keyof WorkoutTableRow;
  const repsKey = `Set${setNumber}_reps` as keyof WorkoutTableRow;
  const ermKey = `Set${setNumber}_erm` as keyof WorkoutTableRow;
  return [
    {
      accessorKey: weightKey,
      Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
      header: `S${setNumber} kg`,
      size: 80,
    },
    {
      accessorKey: repsKey,
      Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
      header: `S${setNumber} reps`,
      size: 80,
    },
    {
      accessorKey: ermKey,
      Cell: ({ cell }) => formatERM(cell.getValue<null | number>()),
      header: `S${setNumber} eRM`,
      id: `Set${setNumber}_erm`,
      size: 90,
    },
  ];
};

export const useSetColumns = (): Array<MRT_ColumnDef<WorkoutTableRow>> =>
  useMemo(
    () => [1, 2, 3, 4, 5].flatMap((setNumber) => buildSetColumns(setNumber)),
    [],
  );

export const HIDDEN_SET_COLUMNS: Record<string, boolean> = {
  Set2_erm: false,
  Set2_reps: false,
  Set2_weight: false,
  Set3_erm: false,
  Set3_reps: false,
  Set3_weight: false,
  Set4_erm: false,
  Set4_reps: false,
  Set4_weight: false,
  Set5_erm: false,
  Set5_reps: false,
  Set5_weight: false,
};
