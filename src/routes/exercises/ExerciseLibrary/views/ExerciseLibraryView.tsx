import AddIcon from '@mui/icons-material/Add';
import { Box, Fab, Tab, Tabs, Typography } from '@mui/material';
import { type ReactNode } from 'react';

export type ExerciseLibraryViewProps = {
  readonly children: ReactNode;
  readonly onAdd: () => void;
  readonly onSubViewChange: (view: SubView) => void;
  readonly subView: SubView;
};

export type SubView = 'exercises' | 'muscle-groups';

export const ExerciseLibraryView = ({
  children,
  onAdd,
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

    <Fab
      aria-label={subView === 'exercises' ? 'add exercise' : 'add muscle group'}
      color="secondary"
      onClick={onAdd}
      sx={{ bottom: 80, position: 'fixed', right: 24 }}
    >
      <AddIcon />
    </Fab>
  </Box>
);
