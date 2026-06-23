import { useListMuscleGroupSetRowsInRangeQuery } from '@/store/entities/analytics';
import { useGetBodyWeightQuery } from '@/store/entities/settings';
import { musclesFromSetRows } from '@/utils/analytics/fromWorkouts';
import { muscleGroupMetricStrategies } from '@/utils/analytics/muscleGroupMetric';
import { rollingRange, type RosePeriod } from '@/utils/analytics/timeWindows';
import { useMemo, useState } from 'react';

export type RoseSpoke = {
  color: string;
  name: string;
  value: number;
};

/**
 * Wind-rose data for the muscle-group balance chart. Re-loads on `period`
 * change and scores each trained group with the active metric strategy.
 */
export const useMuscleGroupRose = () => {
  const [period, setPeriod] = useState<RosePeriod>('month');

  const { endIso, startIso } = useMemo(() => rollingRange(period), [period]);

  const bodyWeightQuery = useGetBodyWeightQuery();
  const rowsQuery = useListMuscleGroupSetRowsInRangeQuery({ endIso, startIso });

  const loading = bodyWeightQuery.isLoading || rowsQuery.isLoading;

  const spokes = useMemo<RoseSpoke[]>(() => {
    const rows = rowsQuery.data;
    if (!rows) {
      return [];
    }

    const bodyWeight = bodyWeightQuery.data ?? null;
    const strategy = muscleGroupMetricStrategies.getActive();
    return musclesFromSetRows(rows, bodyWeight).map((group) => ({
      color: group.color,
      name: group.name,
      value: strategy.calculate(group.sessions),
    }));
  }, [bodyWeightQuery.data, rowsQuery.data]);

  return {
    isEmpty: spokes.length === 0,
    loading,
    metricLabel: muscleGroupMetricStrategies.getActive().label,
    period,
    setPeriod,
    spokes,
  };
};
