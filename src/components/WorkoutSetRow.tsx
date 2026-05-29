import { type WorkoutTableRow } from '../database';
import {
  computeEffectiveWeight,
  computeERM,
  type ExerciseClassification,
} from '../utils/erm';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

type SetColumnsOptions = {
  bodyWeight: null | number;
  classificationByName: Map<string, ExerciseClassification>;
};

const renderNullable = (value: null | number) => value ?? '—';

const formatERM = (value: null | number): string => {
  if (value === null) {
    return '—';
  }

  return value.toFixed(1);
};

const computeSetERM = (
  row: WorkoutTableRow,
  setNumber: number,
  options: SetColumnsOptions,
): null | number => {
  const weight = row[`Set${setNumber}_weight` as keyof WorkoutTableRow] as
    | null
    | number;
  const reps = row[`Set${setNumber}_reps` as keyof WorkoutTableRow] as
    | null
    | number;
  if (weight === null || reps === null || reps <= 0) {
    return null;
  }

  const classification =
    options.classificationByName.get(row.exercise_name) ?? 'standard';
  const effective = computeEffectiveWeight({
    bodyWeight: options.bodyWeight,
    classification,
    loggedWeight: weight,
  });
  if (effective === null) {
    return null;
  }

  return computeERM(effective, reps);
};

const buildSetColumns = (
  setNumber: number,
  options: SetColumnsOptions,
): Array<MRT_ColumnDef<WorkoutTableRow>> => {
  const weightKey = `Set${setNumber}_weight` as keyof WorkoutTableRow;
  const repsKey = `Set${setNumber}_reps` as keyof WorkoutTableRow;
  const ermId = `Set${setNumber}_erm`;
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
      accessorFn: (row) => computeSetERM(row, setNumber, options),
      Cell: ({ cell }) => formatERM(cell.getValue<null | number>()),
      header: `S${setNumber} eRM`,
      id: ermId,
      size: 90,
    },
  ];
};

export const useSetColumns = (
  options: SetColumnsOptions,
): Array<MRT_ColumnDef<WorkoutTableRow>> => {
  const { bodyWeight, classificationByName } = options;
  return useMemo(
    () =>
      [1, 2, 3, 4, 5].flatMap((setNumber) =>
        buildSetColumns(setNumber, options),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options is rebuilt each render; depend on its contents
    [bodyWeight, classificationByName],
  );
};

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
