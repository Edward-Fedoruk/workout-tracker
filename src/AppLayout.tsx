import { initDatabase, MigrationError } from './database';
import { MigrationErrorDialog } from './routes/workouts/MigrationErrorDialog';
import { Box, Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

type TabValue = 'exercises' | 'log' | 'routines' | 'settings';

const TAB_ROUTES: Record<string, TabValue> = {
  '/exercises': 'exercises',
  '/log': 'log',
  '/routines': 'routines',
  '/settings': 'settings',
};

const pathnameToTabValue = (pathname: string): false | TabValue =>
  TAB_ROUTES[pathname] ?? false;

export const AppLayout = () => {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [migrationError, setMigrationError] = useState<MigrationError | null>(
    null,
  );
  const location = useLocation();
  const navigate = useNavigate();

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

    window.location.reload();
  };

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

    run().catch(() => undefined);
  }, []);

  if (migrationError !== null) {
    return (
      <MigrationErrorDialog
        error={migrationError}
        onReset={() => {
          handleReset().catch(() => undefined);
        }}
      />
    );
  }

  if (!isDatabaseReady) {
    return <Box sx={{ padding: 2 }}>Loading...</Box>;
  }

  const tabValue = pathnameToTabValue(location.pathname);

  return (
    <>
      {tabValue !== false && (
        <Tabs
          onChange={(_, value: TabValue) => navigate(`/${value}`)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          value={tabValue}
        >
          <Tab
            label="Log"
            value="log"
          />
          <Tab
            label="Routines"
            value="routines"
          />
          <Tab
            label="Exercises"
            value="exercises"
          />
          <Tab
            label="Settings"
            value="settings"
          />
        </Tabs>
      )}
      <Outlet />
    </>
  );
};
