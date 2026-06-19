import { getBodyWeight, listSetRowsInRange } from '@/database';
import { sessionsFromSetRows } from '@/utils/analytics/fromWorkouts';
import { strengthScoreStrategies } from '@/utils/analytics/strengthScore';
import { weeklyBucketsSince } from '@/utils/analytics/timeWindows';
import { useEffect, useState } from 'react';

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
  const [points, setPoints] = useState<StrengthProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [bodyWeight, rows] = await Promise.all([
        getBodyWeight(),
        listSetRowsInRange('0001-01-01', '9999-12-31'),
      ]);

      const firstIso = rows[0]?.isoDate;
      if (firstIso === undefined) {
        if (!cancelled) {
          setPoints([]);
          setLoading(false);
        }

        return;
      }

      const strategy = strengthScoreStrategies.getActive();
      const buckets = weeklyBucketsSince(firstIso);
      const next = buckets.map((bucket) => {
        const inBucket = rows.filter(
          (row) =>
            row.isoDate >= bucket.startIso && row.isoDate <= bucket.endIso,
        );

        return {
          score: strategy.calculate(sessionsFromSetRows(inBucket, bodyWeight)),
          weekLabel: bucket.endIso,
        };
      });

      if (!cancelled) {
        setPoints(next);
        setLoading(false);
      }
    };

    load().catch(() => {
      if (!cancelled) {
        setPoints([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isEmpty: points.every((point) => point.score === null),
    loading,
    points,
  };
};
