/**
 * Pure time-window helpers for analytics ranges. All bounds are inclusive and
 * formatted as local `YYYY-MM-DD` to match `workout_date` storage (see
 * `dateGroup.ts`). No DB or library dependency — these only do date math.
 */

export type IsoRange = { endIso: string; startIso: string };
export type RosePeriod = 'month' | 'week' | 'year';

const DAYS_IN_PERIOD: Record<RosePeriod, number> = {
  month: 30,
  week: 7,
  year: 365,
};

/**
 * Local `YYYY-MM-DD` for a date (no UTC shift, unlike `toISOString`).
 */
const toLocalIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * A new local date `days` before `from` (negative `days` moves forward).
 */
const shiftDays = (from: Date, days: number): Date => {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  next.setDate(next.getDate() - days);

  return next;
};

/**
 * The rolling window ending today: the last 7 / 30 / 365 days inclusive.
 */
export const rollingRange = (
  period: RosePeriod,
  now: Date = new Date(),
): IsoRange => {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = shiftDays(end, DAYS_IN_PERIOD[period] - 1);

  return { endIso: toLocalIso(end), startIso: toLocalIso(start) };
};

/**
 * The current and previous rolling 7-day windows. The current week ends today;
 * the previous week is the seven days immediately before it.
 */
export const currentAndPreviousWeek = (
  now: Date = new Date(),
): { current: IsoRange; previous: IsoRange } => {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentStart = shiftDays(end, 6);
  const previousEnd = shiftDays(end, 7);
  const previousStart = shiftDays(end, 13);

  return {
    current: { endIso: toLocalIso(end), startIso: toLocalIso(currentStart) },
    previous: {
      endIso: toLocalIso(previousEnd),
      startIso: toLocalIso(previousStart),
    },
  };
};

/**
 * Consecutive 7-day buckets anchored so the most recent ends today, walking
 * back until the bucket containing `firstIso`. Returned oldest → newest so the
 * weekly progress chart plots every week with data (FR-013).
 */
export const weeklyBucketsSince = (
  firstIso: string,
  now: Date = new Date(),
): IsoRange[] => {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets: IsoRange[] = [];
  let bucketEnd = end;

  // Walk newest → oldest, prepending so the result reads oldest → newest.
  // Cap iterations defensively so a bad `firstIso` can never spin forever.
  for (let week = 0; week < 520; week += 1) {
    const bucketStart = shiftDays(bucketEnd, 6);
    const startIso = toLocalIso(bucketStart);
    buckets.unshift({ endIso: toLocalIso(bucketEnd), startIso });

    if (startIso <= firstIso) {
      break;
    }

    bucketEnd = shiftDays(bucketEnd, 7);
  }

  return buckets;
};
