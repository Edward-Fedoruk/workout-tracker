import {
  type Exercise,
  listWorkoutsByExerciseName,
  type WorkoutTableRow,
} from '@/database';
import { sessionErmStrategies } from '@/utils/analytics/sessionErm';
import { type AnalyticsSet } from '@/utils/analytics/types';
import { useEffect, useMemo, useState } from 'react';

export type ParameterKey =
  | 'overallErm'
  | `set${SetNumber}_erm`
  | `set${SetNumber}_reps`
  | `set${SetNumber}_weight`;

export type ParameterUnit = 'erm' | 'reps' | 'weight';

export type TimeRange = 'all' | 'month' | 'year';

export type UnitChart = {
  series: Array<{ data: Array<null | number>; id: string; label: string }>;
  unit: ParameterUnit;
  xDates: string[];
};

type ParameterDefinition = {
  key: ParameterKey;
  label: string;
  unit: ParameterUnit;
  value: (row: WorkoutTableRow) => null | number;
};

type SetNumber = 1 | 2 | 3 | 4 | 5;

const SET_NUMBERS: SetNumber[] = [1, 2, 3, 4, 5];
const UNIT_ORDER: ParameterUnit[] = ['reps', 'weight', 'erm'];

/**
 * Build the normalized sets of one pivot row (for the Overall eRM strategy).
 */
const rowToSets = (row: WorkoutTableRow): AnalyticsSet[] =>
  SET_NUMBERS.flatMap((setNumber) => {
    const reps = row[`Set${setNumber}_reps`];
    const weight = row[`Set${setNumber}_weight`];
    const erm = row[`Set${setNumber}_erm`];

    if (reps === null && weight === null && erm === null) {
      return [];
    }

    return [{ effectiveWeight: null, erm, reps: reps ?? 0, setNumber, weight }];
  });

const PARAMETER_DEFS: ParameterDefinition[] = [
  ...SET_NUMBERS.flatMap<ParameterDefinition>((setNumber) => [
    {
      key: `set${setNumber}_reps`,
      label: `Set ${setNumber} reps`,
      unit: 'reps',
      value: (row) => row[`Set${setNumber}_reps`],
    },
    {
      key: `set${setNumber}_weight`,
      label: `Set ${setNumber} weight`,
      unit: 'weight',
      value: (row) => row[`Set${setNumber}_weight`],
    },
    {
      key: `set${setNumber}_erm`,
      label: `Set ${setNumber} eRM`,
      unit: 'erm',
      value: (row) => row[`Set${setNumber}_erm`],
    },
  ]),
  {
    key: 'overallErm',
    label: 'Overall eRM',
    unit: 'erm',
    value: (row) => sessionErmStrategies.getActive().calculate(rowToSets(row)),
  },
];

const DEF_BY_KEY = new Map(
  PARAMETER_DEFS.map((definition) => [definition.key, definition]),
);

const filterByRange = (
  rows: WorkoutTableRow[],
  range: TimeRange,
): WorkoutTableRow[] => {
  if (range === 'all') {
    return rows;
  }

  const now = new Date();
  const cutoff =
    range === 'year'
      ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const cutoffString = cutoff.toISOString().slice(0, 10);

  return rows.filter((row) => row.workout_date >= cutoffString);
};

export const useExerciseParameterChart = (exercises: Exercise[]) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<null | number>(
    null,
  );
  const [rows, setRows] = useState<WorkoutTableRow[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<ParameterKey[]>(
    [],
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const selectedName = useMemo(
    () =>
      exercises.find((item) => item.id === selectedExerciseId)?.name ?? null,
    [exercises, selectedExerciseId],
  );

  useEffect(() => {
    let cancelled = false;

    if (selectedName !== null) {
      listWorkoutsByExerciseName(selectedName)
        .then((result) => {
          if (!cancelled) {
            setRows(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRows([]);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [selectedName]);

  // Parameters that actually have data for the selected exercise (any range).
  const availableParameters = useMemo(
    () =>
      PARAMETER_DEFS.filter((definition) =>
        rows.some((row) => definition.value(row) !== null),
      ).map((definition) => ({ key: definition.key, label: definition.label })),
    [rows],
  );

  // Selected parameters restricted to those still available (re-validated on
  // exercise switch without storing the pruned list, FR-010).
  const effectiveParameters = useMemo(() => {
    const available = new Set(availableParameters.map((item) => item.key));

    return selectedParameters.filter((key) => available.has(key));
  }, [availableParameters, selectedParameters]);

  const charts = useMemo<UnitChart[]>(() => {
    // Rows arrive newest-first (SQL `ORDER BY workout_date DESC`); reverse a
    // copy for a left-to-right time axis. `toReversed` is unavailable on the
    // ES2020 lib target, so reverse a spread copy (never mutates state).
    // eslint-disable-next-line unicorn/no-array-reverse -- ES2020 target lacks toReversed; copy is already fresh
    const sorted = [...filterByRange(rows, timeRange)].reverse();
    const xDates = sorted.map((row) => row.workout_date);

    return UNIT_ORDER.flatMap((unit) => {
      const definitions = effectiveParameters
        .map((key) => DEF_BY_KEY.get(key))
        .filter(
          (definition): definition is ParameterDefinition =>
            definition?.unit === unit,
        );

      if (definitions.length === 0) {
        return [];
      }

      const series = definitions.map((definition) => ({
        data: sorted.map((row) => definition.value(row)),
        id: definition.key,
        label: definition.label,
      }));

      return [{ series, unit, xDates }];
    });
  }, [rows, effectiveParameters, timeRange]);

  const toggleParameter = (key: ParameterKey) => {
    setSelectedParameters((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key],
    );
  };

  return {
    availableParameters,
    charts,
    selectedExerciseId,
    selectedParameters: effectiveParameters,
    setSelectedExerciseId,
    setTimeRange,
    timeRange,
    toggleParameter,
  };
};
