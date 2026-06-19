import { ExerciseParameterChart } from './ExerciseParameterChart';
import { MuscleGroupRose } from './MuscleGroupRose';
import { StrengthProgressChart } from './StrengthProgressChart';
import { type Exercise } from '@/database';
import { Box, CircularProgress, Divider } from '@mui/material';

export type AnalyticsViewProps = {
  readonly exercises: Exercise[];
  readonly isLoading: boolean;
};

/**
 * Presentational shell stacking the three analytics sections. Each slot is
 * filled by its own section component as the user stories land.
 */
export const AnalyticsView = ({ exercises, isLoading }: AnalyticsViewProps) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ExerciseParameterChart exercises={exercises} />
      <Divider />
      <StrengthProgressChart />
      <Divider />
      <MuscleGroupRose />
    </Box>
  );
};
