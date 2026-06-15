import { BodyWeightForm } from '@/routes/settings/BodyWeightForm';
import { DatabaseActions } from '@/routes/settings/DatabaseActions';
import { type UseBodyWeightReturn } from '@/routes/settings/hooks/useBodyWeight';
import { type UseDatabaseActionsReturn } from '@/routes/settings/hooks/useDatabaseActions';
import { type UseDisplaySettingsReturn } from '@/routes/settings/hooks/useDisplaySettings';
import {
  Box,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

export type SettingsViewProps = {
  readonly bodyWeight: UseBodyWeightReturn;
  readonly databaseActions: UseDatabaseActionsReturn;
  readonly displaySettings: UseDisplaySettingsReturn;
};

export const SettingsView = ({
  bodyWeight,
  databaseActions,
  displaySettings,
}: SettingsViewProps) => (
  <Box sx={{ maxWidth: 480, mx: 'auto', padding: 2 }}>
    <Typography
      sx={{ mb: 2 }}
      variant="h5"
    >
      Settings
    </Typography>

    <Stack spacing={2}>
      <BodyWeightForm
        feedback={bodyWeight.feedback}
        isLoading={bodyWeight.isLoading}
        isSaving={bodyWeight.isSaving}
        onClearFeedback={() => {
          bodyWeight.clearFeedback();
        }}
        onSave={bodyWeight.handleSave}
        value={bodyWeight.value}
      />

      <Divider />

      <Typography variant="subtitle1">Display</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={displaySettings.exerciseNamesInTables}
            disabled={displaySettings.isLoading}
            onChange={() => {
              displaySettings.toggle().catch(() => undefined);
            }}
          />
        }
        label="Exercise Names in Tables"
      />

      <Divider />

      <Typography variant="subtitle1">Data</Typography>
      <Typography
        color="text.secondary"
        variant="body2"
      >
        Export your database as a backup or import a previously exported file.
        Importing will replace all current data.
      </Typography>
      <DatabaseActions {...databaseActions} />
    </Stack>
  </Box>
);
