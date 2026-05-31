import {
  createExercise,
  createMuscleGroup,
  deleteExercise,
  deleteMuscleGroup,
  type Exercise,
  type ExerciseClassification,
  listExercises,
  listMuscleGroups,
  type MuscleGroup,
  updateExercise,
  updateMuscleGroup,
} from '../../database';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseList } from './ExerciseList';
import { MuscleGroupForm } from './MuscleGroupForm';
import { MuscleGroupList } from './MuscleGroupList';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

type SubView = 'exercises' | 'muscle-groups';

export const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [subView, setSubView] = useState<SubView>('exercises');

  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [exerciseDialogMode, setExerciseDialogMode] = useState<
    'create' | 'edit'
  >('create');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseDuplicateError, setExerciseDuplicateError] = useState<
    null | string
  >(null);

  const [muscleGroupDialogOpen, setMuscleGroupDialogOpen] = useState(false);
  const [muscleGroupDialogMode, setMuscleGroupDialogMode] = useState<
    'create' | 'edit'
  >('create');
  const [editingMuscleGroup, setEditingMuscleGroup] =
    useState<MuscleGroup | null>(null);
  const [muscleGroupDuplicateError, setMuscleGroupDuplicateError] = useState<
    null | string
  >(null);

  const [pendingExerciseDelete, setPendingExerciseDelete] =
    useState<Exercise | null>(null);
  const [pendingMuscleGroupDelete, setPendingMuscleGroupDelete] =
    useState<MuscleGroup | null>(null);

  const refreshExercises = async () => {
    const list = await listExercises();
    setExercises(list);
  };

  const refreshMuscleGroups = async () => {
    const list = await listMuscleGroups();
    setMuscleGroups(list);
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([refreshExercises(), refreshMuscleGroups()]);
    };

    initialize().catch(() => undefined);
  }, []);

  const openCreateExercise = () => {
    setEditingExercise(null);
    setExerciseDialogMode('create');
    setExerciseDuplicateError(null);
    setExerciseDialogOpen(true);
  };

  const openEditExercise = (exerciseToEdit: Exercise) => {
    setEditingExercise(exerciseToEdit);
    setExerciseDialogMode('edit');
    setExerciseDuplicateError(null);
    setExerciseDialogOpen(true);
  };

  const handleSaveExercise = async (
    name: string,
    muscleGroupIds: number[],
    classification: ExerciseClassification,
  ) => {
    const lowerName = name.toLowerCase();
    const duplicate = exercises.some(
      (item) =>
        item.name.toLowerCase() === lowerName &&
        item.id !== editingExercise?.id,
    );
    if (duplicate) {
      setExerciseDuplicateError('An exercise with this name already exists');
      return;
    }

    setExerciseDuplicateError(null);

    if (exerciseDialogMode === 'edit' && editingExercise) {
      await updateExercise(
        editingExercise.id,
        name,
        muscleGroupIds,
        classification,
      );
    } else {
      await createExercise(name, muscleGroupIds, classification);
    }

    await refreshExercises();
    setExerciseDialogOpen(false);
  };

  const handleConfirmDeleteExercise = async () => {
    if (!pendingExerciseDelete) {
      return;
    }

    const target = pendingExerciseDelete;
    setPendingExerciseDelete(null);
    await deleteExercise(target.id);
    await refreshExercises();
  };

  const openCreateMuscleGroup = () => {
    setEditingMuscleGroup(null);
    setMuscleGroupDialogMode('create');
    setMuscleGroupDuplicateError(null);
    setMuscleGroupDialogOpen(true);
  };

  const openRenameMuscleGroup = (group: MuscleGroup) => {
    setEditingMuscleGroup(group);
    setMuscleGroupDialogMode('edit');
    setMuscleGroupDuplicateError(null);
    setMuscleGroupDialogOpen(true);
  };

  const handleSaveMuscleGroup = async (name: string, color: string) => {
    const lowerName = name.toLowerCase();
    const duplicate = muscleGroups.some(
      (item) =>
        item.name.toLowerCase() === lowerName &&
        item.id !== editingMuscleGroup?.id,
    );
    if (duplicate) {
      setMuscleGroupDuplicateError(
        'A muscle group with this name already exists',
      );
      return;
    }

    setMuscleGroupDuplicateError(null);

    if (muscleGroupDialogMode === 'edit' && editingMuscleGroup) {
      await updateMuscleGroup(editingMuscleGroup.id, name, color);
    } else {
      await createMuscleGroup(name, color);
    }

    await refreshMuscleGroups();
    setMuscleGroupDialogOpen(false);
  };

  const handleConfirmDeleteMuscleGroup = async () => {
    if (!pendingMuscleGroupDelete) {
      return;
    }

    const target = pendingMuscleGroupDelete;
    setPendingMuscleGroupDelete(null);
    await deleteMuscleGroup(target.id);
    await Promise.all([refreshMuscleGroups(), refreshExercises()]);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography
        sx={{ mb: 2 }}
        variant="h5"
      >
        Exercise Library
      </Typography>

      <Tabs
        onChange={(_, value: SubView) => setSubView(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        value={subView}
      >
        <Tab
          label="Exercises"
          value="exercises"
        />
        <Tab
          label="Muscle Groups"
          value="muscle-groups"
        />
      </Tabs>

      {subView === 'exercises' && (
        <>
          <Stack
            direction="row"
            sx={{ justifyContent: 'flex-end', mb: 2 }}
          >
            <Button
              onClick={openCreateExercise}
              startIcon={<AddIcon />}
              sx={{ minHeight: 44 }}
              variant="contained"
            >
              Add exercise
            </Button>
          </Stack>
          <ExerciseList
            exercises={exercises}
            onDelete={setPendingExerciseDelete}
            onEdit={openEditExercise}
          />
        </>
      )}

      {subView === 'muscle-groups' && (
        <>
          <Stack
            direction="row"
            sx={{ justifyContent: 'flex-end', mb: 2 }}
          >
            <Button
              onClick={openCreateMuscleGroup}
              startIcon={<AddIcon />}
              sx={{ minHeight: 44 }}
              variant="contained"
            >
              Add muscle group
            </Button>
          </Stack>
          <MuscleGroupList
            muscleGroups={muscleGroups}
            onDelete={setPendingMuscleGroupDelete}
            onRename={openRenameMuscleGroup}
          />
        </>
      )}

      <ExerciseForm
        duplicateError={exerciseDuplicateError}
        initialValues={
          editingExercise
            ? {
                classification: editingExercise.classification,
                muscleGroupIds: editingExercise.muscleGroups.map(
                  (group) => group.id,
                ),
                name: editingExercise.name,
              }
            : undefined
        }
        mode={exerciseDialogMode}
        muscleGroups={muscleGroups}
        onCancel={() => setExerciseDialogOpen(false)}
        onSave={(name, ids, classification) => {
          handleSaveExercise(name, ids, classification).catch(() => undefined);
        }}
        open={exerciseDialogOpen}
      />

      <MuscleGroupForm
        duplicateError={muscleGroupDuplicateError}
        initialColor={editingMuscleGroup?.color}
        initialName={editingMuscleGroup?.name}
        mode={muscleGroupDialogMode}
        onCancel={() => setMuscleGroupDialogOpen(false)}
        onSave={(name, color) => {
          handleSaveMuscleGroup(name, color).catch(() => undefined);
        }}
        open={muscleGroupDialogOpen}
      />

      <Dialog
        onClose={() => setPendingExerciseDelete(null)}
        open={pendingExerciseDelete !== null}
      >
        <DialogTitle>Delete exercise?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete &ldquo;{pendingExerciseDelete?.name}&rdquo;? Past workout log
            entries are preserved; routine slots referencing it will be cleared.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPendingExerciseDelete(null)}
            sx={{ minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              handleConfirmDeleteExercise().catch(() => undefined);
            }}
            sx={{ minHeight: 44 }}
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        onClose={() => setPendingMuscleGroupDelete(null)}
        open={pendingMuscleGroupDelete !== null}
      >
        <DialogTitle>Delete muscle group?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete &ldquo;{pendingMuscleGroupDelete?.name}&rdquo;? Exercises
            using this group will be unassigned but remain in the library.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPendingMuscleGroupDelete(null)}
            sx={{ minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              handleConfirmDeleteMuscleGroup().catch(() => undefined);
            }}
            sx={{ minHeight: 44 }}
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
