import { useMuscleGroupRose } from '@/routes/exercises/Analytics/hooks/useMuscleGroupRose';
import { type RosePeriod } from '@/utils/analytics/timeWindows';
import {
  Box,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { RadarChart } from '@mui/x-charts/RadarChart';

export const MuscleGroupRose = () => {
  const { isEmpty, loading, metricLabel, period, setPeriod, spokes } =
    useMuscleGroupRose();

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
          Muscle Group Balance
        </Typography>
        <ToggleButtonGroup
          exclusive
          onChange={(_, value: null | RosePeriod) => {
            if (value !== null) {
              setPeriod(value);
            }
          }}
          size="small"
          value={period}
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
          No muscle groups trained in this period.
        </Typography>
      ) : (
        <RadarChart
          height={300}
          radar={{
            max: Math.max(...spokes.map((spoke) => spoke.value)),
            metrics: spokes.map((spoke) => spoke.name),
          }}
          series={[
            {
              data: spokes.map((spoke) => spoke.value),
              fillArea: true,
              label: metricLabel,
            },
          ]}
          sx={{ width: '100%' }}
        />
      )}
    </Box>
  );
};
