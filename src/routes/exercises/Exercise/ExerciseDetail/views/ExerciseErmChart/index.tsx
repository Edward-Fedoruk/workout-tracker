import { type WorkoutTableRow } from '@/database';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';

type TimeRange = 'all' | 'month' | 'year';

type ErmChartSeries = {
  data: Array<null | number>;
  id: string;
  label: string;
};

type ExerciseErmChartProps = {
  readonly rows: WorkoutTableRow[];
};

const SET_DEFS = [
  { ermKey: 'Set1_erm' as const, id: 'set-1', label: 'Set 1' },
  { ermKey: 'Set2_erm' as const, id: 'set-2', label: 'Set 2' },
  { ermKey: 'Set3_erm' as const, id: 'set-3', label: 'Set 3' },
  { ermKey: 'Set4_erm' as const, id: 'set-4', label: 'Set 4' },
  { ermKey: 'Set5_erm' as const, id: 'set-5', label: 'Set 5' },
] as const;

function filterByRange(rows: WorkoutTableRow[], range: TimeRange): WorkoutTableRow[] {
  if (range === 'all') return rows;
  const now = new Date();
  const cutoff =
    range === 'year'
      ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return rows.filter((r) => r.workout_date >= cutoffStr);
}

function deriveChartData(filteredRows: WorkoutTableRow[]): {
  series: ErmChartSeries[];
  xDates: string[];
} {
  const sorted = [...filteredRows].reverse();
  const xDates = sorted.map((r) => r.workout_date);

  const series = SET_DEFS.map(({ ermKey, id, label }) => ({
    data: sorted.map((r) => r[ermKey] ?? null),
    id,
    label,
  })).filter((s) => s.data.some((v) => v !== null));

  return { series, xDates };
}

export const ExerciseErmChart = ({ rows }: ExerciseErmChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const filtered = filterByRange(rows, timeRange);
  const { series, xDates } = deriveChartData(filtered);

  const isEmpty = series.length === 0;
  const emptyMessage =
    rows.length === 0
      ? 'No workout history yet.'
      : 'No data for the selected period.';

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography
          color="text.secondary"
          variant="overline"
        >
          eRM Progress
        </Typography>
        <ToggleButtonGroup
          exclusive
          onChange={(_, value: TimeRange | null) => {
            if (value !== null) setTimeRange(value);
          }}
          size="small"
          value={timeRange}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {isEmpty ? (
        <Typography
          color="text.secondary"
          sx={{ py: 3, textAlign: 'center' }}
          variant="body2"
        >
          {emptyMessage}
        </Typography>
      ) : (
        <LineChart
          height={240}
          series={series.map((s) => ({
            ...s,
            connectNulls: false,
            showMark: true,
          }))}
          sx={{ width: '100%' }}
          xAxis={[
            {
              data: xDates,
              scaleType: 'band',
              tickLabelStyle: { fontSize: 10 },
            },
          ]}
          yAxis={[{ label: 'eRM (kg)' }]}
        />
      )}
    </Box>
  );
};
