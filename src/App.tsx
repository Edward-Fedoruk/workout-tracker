import { MigrationErrorDialog } from './components/MigrationErrorDialog';
import { WorkoutTable } from './components/WorkoutTable';
import { initDatabase, MigrationError } from './database';
import { Box, createTheme, ThemeProvider } from '@mui/material';
import { useEffect, useState } from 'react';

const muiTheme = createTheme();

export const App = () => {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [migrationError, setMigrationError] = useState<MigrationError | null>(
    null,
  );

  useEffect(() => {
    const run = async () => {
      try {
        await initDatabase();
        setIsDatabaseReady(true);
      } catch (error) {
        if (error instanceof MigrationError) {
          setMigrationError(error);
        } else {
          setMigrationError(new MigrationError('unknown', error));
        }
      }
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    run().catch(() => undefined);
  }, []);

  const handleReset = async () => {
    if (navigator.storage) {
      const root = await navigator.storage.getDirectory();
      for (const name of [
        'app.sqlite3',
        'app.sqlite3-journal',
        'app.sqlite3-wal',
        'app.sqlite3-shm',
      ]) {
        await root.removeEntry(name).catch(() => undefined);
      }
    }

    location.reload();
  };

  if (migrationError !== null) {
    return (
      <ThemeProvider theme={muiTheme}>
        <MigrationErrorDialog
          error={migrationError}
          onReset={() => {
            // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync callback
            handleReset().catch(() => undefined);
          }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      {isDatabaseReady ? (
        <WorkoutTable />
      ) : (
        <Box sx={{ padding: 2 }}>Loading...</Box>
      )}
    </ThemeProvider>
  );
};

export default App;
