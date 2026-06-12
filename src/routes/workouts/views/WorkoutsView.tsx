import { Logo } from '@/components/SplashScreen';
import { AdvancedWorkoutTable } from '@/routes/workouts/AdvancedWorkoutTable';
import { DeleteWorkoutDialog } from '@/routes/workouts/DeleteWorkoutDialog';
import { GroupedWorkoutTable } from '@/routes/workouts/GroupedWorkoutTable';
import { type UseWorkoutsReturn } from '@/routes/workouts/hooks/useWorkouts';
import { WorkoutForm } from '@/routes/workouts/WorkoutForm';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fab,
  IconButton,
  SwipeableDrawer,
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
  return (
    <Box
      sx={{
        bottom: 'calc(56px + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        left: 0,
        overflow: 'hidden',
        position: 'fixed',
        right: 0,
        top: 'env(safe-area-inset-top)',
      }}
    >
      {loadError !== null && (
        <Alert
          severity="error"
          sx={{ flexShrink: 0, mt: 1, mx: 1 }}
        >
          {loadError}
        </Alert>
      )}

      <Box
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexShrink: 0,
          justifyContent: 'space-between',
          px: 2,
          py: 0.75,
        }}
      >
        <Typography
          component="h1"
          sx={{ alignItems: 'center', display: 'flex', gap: 1 }}
          variant="h6"
        >
          <Logo
            height={33}
            width={33}
          />
          Workout Log
        </Typography>
        <Button
          onClick={() => advancedView.onOpen()}
          size="small"
          variant="outlined"
        >
          Advanced view
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <GroupedWorkoutTable
            groups={groups}
            onEdit={(id) => {
              openEdit(id).catch(() => undefined);
            }}
          />
        </Box>
      )}

      <Fab
        aria-label="add workout"
        color="secondary"
        onClick={openCreate}
        sx={{ bottom: 80, position: 'fixed', right: 24 }}
      >
        <AddIcon />
      </Fab>

      {advancedView.isOpen && (
        <AdvancedWorkoutTable
          onClose={() => advancedView.onClose()}
          onDelete={requestDelete}
          onEdit={(id) => {
            openEdit(id).catch(() => undefined);
          }}
          workouts={workouts}
        />
      )}

      <SwipeableDrawer
        anchor="bottom"
        disableSwipeToOpen
        onClose={handleCancelForm}
        onOpen={() => undefined}
        open={formDialog.isOpen}
        sx={{
          '& .MuiDrawer-paper': {
            borderRadius: '12px 12px 0 0',
            maxHeight: '90dvh',
            overflowY: 'auto',
          },
        }}
      >
        <Box sx={{ pb: 4, pt: 2, px: 2 }}>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 1,
            }}
          >
            <Typography variant="h6">
              {editingWorkout ? 'Edit Workout' : 'Add Workout'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {editingWorkout && (
                <IconButton
                  color="error"
                  onClick={() => {
                    handleCancelForm();
                    requestDelete(editingWorkout.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
              <IconButton onClick={handleCancelForm}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <WorkoutForm
            bodyWeight={bodyWeight}
            exercises={exercises}
            onCancel={handleCancelForm}
            onSave={handleSave}
            {...(editingWorkout ? { initialData: editingWorkout } : {})}
          />
        </Box>
      </SwipeableDrawer>

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
