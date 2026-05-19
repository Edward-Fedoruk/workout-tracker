import { WorkoutTable } from './components/WorkoutTable';
import { initDatabase } from './database';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import { useEffect, useState } from 'react';

const muiTheme = createTheme();

export const App = () => {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const run = async () => {
      try {
        await initDatabase();
        setIsDatabaseReady(true);
      } catch {
        setError('Failed to initialize the database. See console for details.');
      }
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    run().catch(() => undefined);
  }, []);

  if (error !== null) {
    return (
      <ThemeProvider theme={muiTheme}>
        <Box sx={{ color: 'error.main', p: 2 }}>
          {error}
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      {isDatabaseReady ? <WorkoutTable /> : <Box sx={{ p: 2 }}>Loading...</Box>}
    </ThemeProvider>
  );
};

export default App;
