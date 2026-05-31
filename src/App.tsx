import { ExerciseLibrary } from './components/exercises/ExerciseLibrary';
import { MigrationErrorDialog } from './components/MigrationErrorDialog';
import { RoutineEditor } from './components/routines/RoutineEditor';
import { RoutineList } from './components/routines/RoutineList';
import { RoutineWorkoutForm } from './components/routines/RoutineWorkoutForm';
import { SettingsPage } from './components/settings/SettingsPage';
import { WorkoutTable } from './components/WorkoutTable';
import { initDatabase, MigrationError } from './database';
import { Box, createTheme, Tab, Tabs, ThemeProvider } from '@mui/material';
import { useEffect, useState } from 'react';

type ActiveView =
  | { routineId: null | number; type: 'edit-routine' }
  | { routineId: number; type: 'start-routine' }
  | { type: 'exercises' }
  | { type: 'log' }
  | { type: 'routines' }
  | { type: 'settings' };

const muiTheme = createTheme();

export const App = () => {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [migrationError, setMigrationError] = useState<MigrationError | null>(
    null,
  );
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'log' });

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

  const showTabBar =
    activeView.type === 'log' ||
    activeView.type === 'routines' ||
    activeView.type === 'exercises' ||
    activeView.type === 'settings';

  const renderContent = () => {
    if (!isDatabaseReady) {
      return <Box sx={{ padding: 2 }}>Loading...</Box>;
    }

    if (activeView.type === 'log') {
      return <WorkoutTable />;
    }

    if (activeView.type === 'routines') {
      return (
        <RoutineList
          onAdd={() => setActiveView({ routineId: null, type: 'edit-routine' })}
          onEdit={(routineId) =>
            setActiveView({ routineId, type: 'edit-routine' })
          }
          onStart={(routineId) =>
            setActiveView({ routineId, type: 'start-routine' })
          }
        />
      );
    }

    if (activeView.type === 'edit-routine') {
      return (
        <RoutineEditor
          onBack={() => setActiveView({ type: 'routines' })}
          routineId={activeView.routineId}
        />
      );
    }

    if (activeView.type === 'exercises') {
      return <ExerciseLibrary />;
    }

    if (activeView.type === 'start-routine') {
      return (
        <RoutineWorkoutForm
          onBack={() => setActiveView({ type: 'routines' })}
          routineId={activeView.routineId}
        />
      );
    }

    if (activeView.type === 'settings') {
      return <SettingsPage />;
    }

    return null;
  };

  return (
    <ThemeProvider theme={muiTheme}>
      {showTabBar && isDatabaseReady && (
        <Tabs
          onChange={(_, value: string) => {
            if (value === 'log') {
              setActiveView({ type: 'log' });
            }

            if (value === 'routines') {
              setActiveView({ type: 'routines' });
            }

            if (value === 'exercises') {
              setActiveView({ type: 'exercises' });
            }

            if (value === 'settings') {
              setActiveView({ type: 'settings' });
            }
          }}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          value={activeView.type}
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
      {renderContent()}
    </ThemeProvider>
  );
};

export default App;
