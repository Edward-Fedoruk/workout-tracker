import { type WorkoutTableRow } from '@/database';

export type WorkoutDateGroup = {
  isoDate: string;
  label: string;
  rows: WorkoutTableRow[];
};

export const formatDateGroupLabel = (isoDate: string, now: Date): string => {
  const parts = isoDate.split('-').map(Number);
  const [year, month, day] = parts as [number, number, number];
  const date = new Date(year, month - 1, day);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const delta = Math.round(
    (todayStart.getTime() - date.getTime()) / 86_400_000,
  );

  if (delta === 0) {
    return 'Today';
  }

  if (delta === 1) {
    return 'Yesterday';
  }

  if (delta > 1 && delta <= 6) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};

export const groupWorkoutsByDate = (
  rows: WorkoutTableRow[],
  now = new Date(),
): WorkoutDateGroup[] => {
  const groups: WorkoutDateGroup[] = [];
  let current: null | WorkoutDateGroup = null;

  for (const row of rows) {
    if (current === null || current.isoDate !== row.workout_date) {
      current = {
        isoDate: row.workout_date,
        label: formatDateGroupLabel(row.workout_date, now),
        rows: [],
      };
      groups.push(current);
    }

    current.rows.push(row);
  }

  return groups;
};
