import { Box, Tab, Tabs, Typography } from '@mui/material';
import { type ReactNode } from 'react';

export type ExerciseLibraryViewProps = {
  readonly children: ReactNode;
  readonly onSubViewChange: (view: SubView) => void;
  readonly subView: SubView;
};

export type SubView = 'exercises' | 'muscle-groups';

export const ExerciseLibraryView = ({
  children,
  onSubViewChange,
  subView,
}: ExerciseLibraryViewProps) => (
  <Box sx={{ padding: 2 }}>
    <Typography
      sx={{ mb: 2 }}
      variant="h5"
    >
      Exercise Library
    </Typography>

    <Tabs
      onChange={(_, value: SubView) => onSubViewChange(value)}
      sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      value={subView}
    >
      <Tab
        label="Exercises"
        value="exercises"
      />
      <Tab
        label="Muscle Groups"
        value="muscle-groups"
      />
    </Tabs>

    {children}
  </Box>
);
