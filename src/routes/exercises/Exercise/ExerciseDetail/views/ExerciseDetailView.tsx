import { type UseExerciseDetailReturn } from '../hooks/useExerciseDetail';
import { ExerciseErmChart } from './ExerciseErmChart';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExerciseForm } from '@/routes/exercises/Exercise/ExerciseForm';
import { MuscleGroupChip } from '@/routes/exercises/MuscleGroup/MuscleGroupChip';
import { DeleteWorkoutDialog } from '@/routes/workouts/DeleteWorkoutDialog';
import { GroupedWorkoutTable } from '@/routes/workouts/GroupedWorkoutTable';
import { WorkoutForm } from '@/routes/workouts/WorkoutForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Avatar,
  Box,
  CircularProgress,
  DialogContentText,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export type ExerciseDetailViewProps = UseExerciseDetailReturn & {
  readonly onBack: () => void;
};

export const ExerciseDetailView = ({
  bodyWeight,
  cancelDelete,
  cancelDeleteWorkout,
  confirmDelete,
  confirmDeleteWorkout,
  deleteConfirm,
  dialog,
  editingExercise,
  editingWorkout,
  exercise,
  exercises,
  groups,
  handleCancelWorkoutForm,
  handleSave,
  handleSaveWorkout,
  isLoading,
  muscleGroups,
  notFound,
  onBack,
  openEdit,
  openEditWorkout,
  pendingDelete,
  rawRows,
  requestDelete,
  requestDeleteWorkout,
  workoutDeleteConfirm,
  workoutFormDialog,
}: ExerciseDetailViewProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ padding: 2 }}>
        <IconButton
          aria-label="Go back"
          onClick={onBack}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography color="text.secondary">Exercise not found.</Typography>
      </Box>
    );
  }

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
      {/* Exercise info header */}
      <Box sx={{ flexShrink: 0, px: 2, py: 1.5 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 1 }}>
          <IconButton
            aria-label="Go back"
            onClick={onBack}
          >
            <ArrowBackIcon />
          </IconButton>
          <Avatar
            alt={exercise?.name}
            src={
              exercise?.imageFilename
                ? `${import.meta.env.BASE_URL}exercises/${exercise.imageFilename}`
                : undefined
            }
            sx={{ height: 56, width: 56 }}
          >
            <FitnessCenterIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{exercise?.name}</Typography>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
              useFlexGap
            >
              {exercise?.muscleGroups.map((group) => (
                <MuscleGroupChip
                  color={group.color}
                  key={group.id}
                  label={group.name}
                />
              ))}
            </Stack>
          </Box>
          <IconButton
            aria-label="More options"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

      </Box>

      <ExerciseErmChart rows={rawRows} />

      {/* History section */}
      <Box sx={{ flexShrink: 0, px: 2 }}>
        <Divider>
          <Typography
            color="text.secondary"
            variant="overline"
          >
            History
          </Typography>
        </Divider>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        open={Boolean(menuAnchor)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            openEdit();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            requestDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* History table — fills remaining space so sticky header works */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {groups.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ pt: 1, px: 2 }}
          >
            No history yet.
          </Typography>
        ) : (
          <GroupedWorkoutTable
            firstColumn="none"
            groups={groups}
            onEdit={(id) => {
              openEditWorkout(id).catch(() => undefined);
            }}
          />
        )}
      </Box>

      {/* Exercise edit form */}
      <ExerciseForm
        initialValues={
          editingExercise
            ? {
                classification: editingExercise.classification,
                imageFilename: editingExercise.imageFilename,
                muscleGroupIds: editingExercise.muscleGroups.map(
                  (group) => group.id,
                ),
                name: editingExercise.name,
              }
            : undefined
        }
        mode="edit"
        muscleGroups={muscleGroups}
        onCancel={() => dialog.onClose()}
        onSave={handleSave}
        open={dialog.isOpen}
      />

      {/* Exercise delete confirm */}
      <ConfirmDialog
        confirmColor="error"
        confirmLabel="Delete"
        onCancel={cancelDelete}
        onConfirm={() => {
          confirmDelete().catch(() => undefined);
        }}
        open={deleteConfirm.isOpen}
        title="Delete exercise?"
      >
        <DialogContentText>
          Delete &ldquo;{pendingDelete?.name}&rdquo;? Past workout log entries
          are preserved; routine slots referencing it will be cleared.
        </DialogContentText>
      </ConfirmDialog>

      {/* Workout edit drawer */}
      <SwipeableDrawer
        anchor="bottom"
        disableSwipeToOpen
        onClose={handleCancelWorkoutForm}
        onOpen={() => undefined}
        open={workoutFormDialog.isOpen}
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
              mb: 1,
            }}
          >
            <Typography variant="h6">Edit Workout</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {editingWorkout && (
                <IconButton
                  color="error"
                  onClick={() => {
                    handleCancelWorkoutForm();
                    requestDeleteWorkout(editingWorkout.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
              <IconButton onClick={handleCancelWorkoutForm}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <WorkoutForm
            bodyWeight={bodyWeight}
            exercises={exercises}
            onCancel={handleCancelWorkoutForm}
            onSave={handleSaveWorkout}
            {...(editingWorkout ? { initialData: editingWorkout } : {})}
          />
        </Box>
      </SwipeableDrawer>

      {/* Workout delete confirm */}
      <DeleteWorkoutDialog
        onCancel={cancelDeleteWorkout}
        onConfirm={() => {
          confirmDeleteWorkout().catch(() => undefined);
        }}
        open={workoutDeleteConfirm.isOpen}
      />
    </Box>
  );
};
