import { initDatabase, MigrationError } from './database';
import { MigrationErrorDialog } from './routes/workouts/MigrationErrorDialog';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
} from '@mui/material';
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

// Height of the fixed bottom bar (56px) plus the iOS home-indicator inset, so
// scrollable content never hides behind the nav.
const NAV_OFFSET = 'calc(56px + env(safe-area-inset-bottom))';

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
  const showNav = tabValue !== false;

  return (
    <>
      <Box sx={{ pb: showNav ? NAV_OFFSET : 0 }}>
        <Outlet />
      </Box>
      {showNav && (
        <Paper
          elevation={0}
          sx={{
            border: 'none',
            borderRadius: 0,
            borderTop: 1,
            borderTopColor: 'divider',
            bottom: 0,
            left: 0,
            paddingBottom: 'env(safe-area-inset-bottom)',
            position: 'fixed',
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <BottomNavigation
            onChange={(_, value: TabValue) => navigate(`/${value}`)}
            showLabels
            value={tabValue}
          >
            <BottomNavigationAction
              icon={<FormatListBulletedIcon />}
              label="Log"
              value="log"
            />
            <BottomNavigationAction
              icon={<PlaylistPlayIcon />}
              label="Routines"
              value="routines"
            />
            <BottomNavigationAction
              icon={<FitnessCenterIcon />}
              label="Exercises"
              value="exercises"
            />
            <BottomNavigationAction
              icon={<SettingsIcon />}
              label="Settings"
              value="settings"
            />
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
};
