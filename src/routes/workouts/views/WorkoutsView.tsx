import { FormDialog } from '@/components';
import { AdvancedWorkoutTable } from '@/routes/workouts/AdvancedWorkoutTable';
import { DeleteWorkoutDialog } from '@/routes/workouts/DeleteWorkoutDialog';
import { GroupedWorkoutTable } from '@/routes/workouts/GroupedWorkoutTable';
import { type UseWorkoutsReturn } from '@/routes/workouts/hooks/useWorkouts';
import { WorkoutForm } from '@/routes/workouts/WorkoutForm';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Fab,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';

export type WorkoutsViewProps = UseWorkoutsReturn;

export const WorkoutsView = ({
  advancedView,
  bodyWeight,
  cancelDelete,
  confirmDelete,
  deleteConfirm,
  editingWorkout,
  exercises,
  formDialog,
  groups,
  handleCancelForm,
  handleSave,
  isLoading,
  loadError,
  openCreate,
  openEdit,
  requestDelete,
  workouts,
}: WorkoutsViewProps) => {
  const handleAdvancedOpen = () => {
    advancedView.onOpen();
  };

  const handleAdvancedClose = () => {
    advancedView.onClose();
  };

  return (
    <Box sx={{ maxWidth: 1_200, mx: 'auto', padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          onClick={handleAdvancedOpen}
          variant="outlined"
        >
          Advanced
        </Button>
      </Box>

      {loadError !== null && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {loadError}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <GroupedWorkoutTable
          groups={groups}
          onDelete={requestDelete}
          onEdit={(id) => {
            openEdit(id).catch(() => undefined);
          }}
        />
      )}

      <Fab
        aria-label="add workout"
        color="secondary"
        onClick={openCreate}
        sx={{ bottom: 80, position: 'fixed', right: 24 }}
      >
        <AddIcon />
      </Fab>

      <Dialog
        fullScreen
        open={advancedView.isOpen}
      >
        <AppBar position="relative">
          <Toolbar>
            <IconButton
              aria-label="close"
              color="inherit"
              edge="start"
              onClick={handleAdvancedClose}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              sx={{ ml: 2 }}
              variant="h6"
            >
              Advanced View
            </Typography>
          </Toolbar>
        </AppBar>
        <AdvancedWorkoutTable
          onAdd={openCreate}
          onDelete={requestDelete}
          onEdit={(id) => {
            openEdit(id).catch(() => undefined);
          }}
          workouts={workouts}
        />
      </Dialog>

      <FormDialog
        maxWidth="sm"
        onClose={handleCancelForm}
        open={formDialog.isOpen}
        title={editingWorkout ? 'Edit Workout' : 'Add Workout'}
      >
        <WorkoutForm
          bodyWeight={bodyWeight}
          exercises={exercises}
          onCancel={handleCancelForm}
          onSave={handleSave}
          {...(editingWorkout ? { initialData: editingWorkout } : {})}
        />
      </FormDialog>

      <DeleteWorkoutDialog
        onCancel={cancelDelete}
        onConfirm={() => {
          confirmDelete().catch(() => undefined);
        }}
        open={deleteConfirm.isOpen}
      />
    </Box>
  );
};
