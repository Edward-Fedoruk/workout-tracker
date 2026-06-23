import { useListSetRowsInRangeQuery } from '@/store/entities/analytics';
import { useGetBodyWeightQuery } from '@/store/entities/settings';
import { sessionsFromSetRows } from '@/utils/analytics/fromWorkouts';
import {
  computeStrengthProgress,
  type WeekOverWeekResult,
} from '@/utils/analytics/strengthScore';
import { currentAndPreviousWeek } from '@/utils/analytics/timeWindows';
import { useMemo } from 'react';

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
  const { current, previous } = useMemo(() => currentAndPreviousWeek(), []);

  const bodyWeightQuery = useGetBodyWeightQuery();
  const currentQuery = useListSetRowsInRangeQuery({
    endIso: current.endIso,
    startIso: current.startIso,
  });
  const previousQuery = useListSetRowsInRangeQuery({
    endIso: previous.endIso,
    startIso: previous.startIso,
  });

  const loading =
    bodyWeightQuery.isLoading ||
    currentQuery.isLoading ||
    previousQuery.isLoading;

  const result = useMemo<WeekOverWeekResult>(() => {
    if (!currentQuery.data || !previousQuery.data) {
      return INSUFFICIENT;
    }

    const bodyWeight = bodyWeightQuery.data ?? null;
    return computeStrengthProgress(
      sessionsFromSetRows(currentQuery.data, bodyWeight),
      sessionsFromSetRows(previousQuery.data, bodyWeight),
    );
  }, [bodyWeightQuery.data, currentQuery.data, previousQuery.data]);

  return { loading, result };
};
