import { getBodyWeight, listSetRowsInRange } from '@/database';
import { sessionsFromSetRows } from '@/utils/analytics/fromWorkouts';
import {
  computeStrengthProgress,
  type WeekOverWeekResult,
} from '@/utils/analytics/strengthScore';
import { currentAndPreviousWeek } from '@/utils/analytics/timeWindows';
import { useEffect, useState } from 'react';

const INSUFFICIENT: WeekOverWeekResult = {
  current: null,
  direction: 'insufficient',
  percentChange: null,
  previous: null,
};

/**
 * Week-over-week overall-strength comparison for the home banner: scores the
 * current rolling 7-day window against the previous one.
 */
export const useStrengthProgress = () => {
  const [result, setResult] = useState<WeekOverWeekResult>(INSUFFICIENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { current, previous } = currentAndPreviousWeek();
      const [bodyWeight, currentRows, previousRows] = await Promise.all([
        getBodyWeight(),
        listSetRowsInRange(current.startIso, current.endIso),
        listSetRowsInRange(previous.startIso, previous.endIso),
      ]);

      const next = computeStrengthProgress(
        sessionsFromSetRows(currentRows, bodyWeight),
        sessionsFromSetRows(previousRows, bodyWeight),
      );

      if (!cancelled) {
        setResult(next);
        setLoading(false);
      }
    };

    load().catch(() => {
      if (!cancelled) {
        setResult(INSUFFICIENT);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, result };
};
