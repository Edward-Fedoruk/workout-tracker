import { useBodyWeight } from './hooks/useBodyWeight';
import { useDatabaseActions } from './hooks/useDatabaseActions';
import { useDisplaySettings } from './hooks/useDisplaySettings';
import { SettingsView } from './views/SettingsView';
import { useEffect } from 'react';

export const Settings = () => {
  const bodyWeight = useBodyWeight();
  const databaseActions = useDatabaseActions();
  const displaySettings = useDisplaySettings();

  useEffect(() => {
    bodyWeight.refresh().catch(() => undefined);
    displaySettings.refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);

  return (
    <SettingsView
      bodyWeight={bodyWeight}
      databaseActions={databaseActions}
      displaySettings={displaySettings}
    />
  );
};
