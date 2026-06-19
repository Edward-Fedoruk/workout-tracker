import { getBodyWeight, listMuscleGroupSetRowsInRange } from '@/database';
import { musclesFromSetRows } from '@/utils/analytics/fromWorkouts';
import { muscleGroupMetricStrategies } from '@/utils/analytics/muscleGroupMetric';
import { rollingRange, type RosePeriod } from '@/utils/analytics/timeWindows';
import { useEffect, useState } from 'react';

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
  const [spokes, setSpokes] = useState<RoseSpoke[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { endIso, startIso } = rollingRange(period);
      const [bodyWeight, rows] = await Promise.all([
        getBodyWeight(),
        listMuscleGroupSetRowsInRange(startIso, endIso),
      ]);

      const strategy = muscleGroupMetricStrategies.getActive();
      const next = musclesFromSetRows(rows, bodyWeight).map((group) => ({
        color: group.color,
        name: group.name,
        value: strategy.calculate(group.sessions),
      }));

      if (!cancelled) {
        setSpokes(next);
        setLoading(false);
      }
    };

    load().catch(() => {
      if (!cancelled) {
        setSpokes([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [period]);

  return {
    isEmpty: spokes.length === 0,
    loading,
    metricLabel: muscleGroupMetricStrategies.getActive().label,
    period,
    setPeriod,
    spokes,
  };
};
