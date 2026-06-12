import { type UseExerciseDetailReturn } from '../hooks/useExerciseDetail';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExerciseForm } from '@/routes/exercises/Exercise/ExerciseForm';
import { MuscleGroupChip } from '@/routes/exercises/MuscleGroup/MuscleGroupChip';
import { GroupedWorkoutTable } from '@/routes/workouts/GroupedWorkoutTable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  Typography,
} from '@mui/material';
import { useState } from 'react';

export type ExerciseDetailViewProps = UseExerciseDetailReturn & {
  readonly onBack: () => void;
};

export const ExerciseDetailView = ({
  cancelDelete,
  confirmDelete,
  deleteConfirm,
  dialog,
  editingExercise,
  exercise,
  groups,
  handleSave,
  isLoading,
  muscleGroups,
  notFound,
  onBack,
  openEdit,
  pendingDelete,
  requestDelete,
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
          <GroupedWorkoutTable groups={groups} />
        )}
      </Box>

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
    </Box>
  );
};
