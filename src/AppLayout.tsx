import { getDraft, initDatabase, MigrationError } from './database';
import { SplashScreen } from '@/components/SplashScreen';
import { MigrationErrorDialog } from './routes/workouts/MigrationErrorDialog';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Badge,
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
  const [hasDraft, setHasDraft] = useState(false);
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
        // Request persistent storage so the browser does not evict our OPFS
        // SQLite DB under storage pressure. Without this the DB is "best-effort"
        // and can be reclaimed on storage-constrained devices, which silently
        // wipes imported data after the post-import reload. Best-effort itself:
        // never let a failure here block DB init.
        await navigator.storage?.persist().catch(() => undefined);

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

  // Refresh the draft badge whenever the route changes, so it appears as soon as
  // the user navigates away from an in-progress workout and clears on submit or
  // discard.
  useEffect(() => {
    if (!isDatabaseReady) {
      return;
    }

    const check = async () => {
      const draft = await getDraft();
      setHasDraft(draft !== null);
    };

    check().catch(() => undefined);
  }, [isDatabaseReady, location.pathname]);

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

  const tabValue = pathnameToTabValue(location.pathname);
  const showNav = tabValue !== false;

  return (
    <>
      <SplashScreen visible={!isDatabaseReady} />
      {isDatabaseReady && (
        <>
          <Box
            sx={{
              pb: showNav ? NAV_OFFSET : 0,
              pt: 'env(safe-area-inset-top)',
            }}
          >
            <Outlet />
          </Box>
        </>
      )}
      {isDatabaseReady && showNav && (
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
              icon={
                <Badge
                  color="error"
                  invisible={!hasDraft}
                  variant="dot"
                >
                  <PlaylistPlayIcon />
                </Badge>
              }
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
