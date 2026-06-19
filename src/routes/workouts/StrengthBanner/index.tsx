import { useStrengthProgress } from './hooks/useStrengthProgress';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Paper, Typography } from '@mui/material';
import { type ReactNode } from 'react';

type Treatment = {
  color: string;
  icon: ReactNode;
  message: string;
};

const formatPercent = (percentChange: null | number): string =>
  percentChange === null ? '' : `${Math.abs(percentChange).toFixed(1)}%`;

export const StrengthBanner = () => {
  const { loading, result } = useStrengthProgress();

  if (loading) {
    return null;
  }

  const treatment = ((): Treatment => {
    switch (result.direction) {
      case 'same':
        return {
          color: 'text.secondary',
          icon: <TrendingFlatIcon fontSize="small" />,
          message: 'About as strong as last week',
        };
      case 'stronger':
        return {
          color: 'success.main',
          icon: <TrendingUpIcon fontSize="small" />,
          message: `Stronger by ${formatPercent(result.percentChange)} vs. last week`,
        };
      case 'weaker':
        return {
          color: 'error.main',
          icon: <TrendingDownIcon fontSize="small" />,
          message: `Weaker by ${formatPercent(result.percentChange)} vs. last week`,
        };
      default:
        return {
          color: 'text.secondary',
          icon: <TrendingFlatIcon fontSize="small" />,
          message: 'Not enough data yet',
        };
    }
  })();

  return (
    <Paper
      sx={{ flexShrink: 0, mt: 1, mx: 1, px: 2, py: 1 }}
      variant="outlined"
    >
      <Box
        sx={{
          alignItems: 'center',
          color: treatment.color,
          display: 'flex',
          gap: 1,
        }}
      >
        {treatment.icon}
        <Typography
          sx={{ color: treatment.color }}
          variant="body2"
        >
          {treatment.message}
        </Typography>
      </Box>
    </Paper>
  );
};
