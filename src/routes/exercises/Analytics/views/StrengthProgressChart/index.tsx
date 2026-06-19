import { useStrengthProgressChart } from '@/routes/exercises/Analytics/hooks/useStrengthProgressChart';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

export const StrengthProgressChart = () => {
  const { isEmpty, loading, points } = useStrengthProgressChart();

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Typography
        color="text.secondary"
        sx={{ display: 'block', mb: 1 }}
        variant="overline"
      >
        Overall Strength Progress
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : isEmpty ? (
        <Typography
          color="text.secondary"
          sx={{ py: 3, textAlign: 'center' }}
          variant="body2"
        >
          Not enough data yet — log a few workouts to see weekly progress.
        </Typography>
      ) : (
        <LineChart
          height={240}
          series={[
            {
              connectNulls: false,
              data: points.map((point) => point.score),
              label: 'Strength score',
              showMark: true,
            },
          ]}
          sx={{ width: '100%' }}
          xAxis={[
            {
              data: points.map((point) => point.weekLabel),
              scaleType: 'band',
              tickLabelStyle: { fontSize: 10 },
            },
          ]}
        />
      )}
    </Box>
  );
};
