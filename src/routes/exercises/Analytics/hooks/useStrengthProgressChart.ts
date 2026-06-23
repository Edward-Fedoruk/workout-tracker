import { useListSetRowsInRangeQuery } from '@/store/entities/analytics';
import { useGetBodyWeightQuery } from '@/store/entities/settings';
import { sessionsFromSetRows } from '@/utils/analytics/fromWorkouts';
import { strengthScoreStrategies } from '@/utils/analytics/strengthScore';
import { weeklyBucketsSince } from '@/utils/analytics/timeWindows';
import { useMemo } from 'react';

export type StrengthProgressPoint = {
  score: null | number;
  weekLabel: string;
};

/**
 * Weekly "overall strength" score for every week since the first logged
 * workout (FR-013). All set rows are loaded once and partitioned into the 7-day
 * buckets the chart plots oldest → newest.
 */
export const useStrengthProgressChart = () => {
  const bodyWeightQuery = useGetBodyWeightQuery();
  const rowsQuery = useListSetRowsInRangeQuery({
    endIso: '9999-12-31',
    startIso: '0001-01-01',
  });

  const loading = bodyWeightQuery.isLoading || rowsQuery.isLoading;

  const points = useMemo<StrengthProgressPoint[]>(() => {
    const rows = rowsQuery.data;
    if (!rows) {
      return [];
    }

    const firstIso = rows[0]?.isoDate;
    if (firstIso === undefined) {
      return [];
    }

    const bodyWeight = bodyWeightQuery.data ?? null;
    const strategy = strengthScoreStrategies.getActive();
    const buckets = weeklyBucketsSince(firstIso);
    return buckets.map((bucket) => {
      const inBucket = rows.filter(
        (row) => row.isoDate >= bucket.startIso && row.isoDate <= bucket.endIso,
      );

      return {
        score: strategy.calculate(sessionsFromSetRows(inBucket, bodyWeight)),
        weekLabel: bucket.endIso,
      };
    });
  }, [bodyWeightQuery.data, rowsQuery.data]);

  return {
    isEmpty: points.every((point) => point.score === null),
    loading,
    points,
  };
};
