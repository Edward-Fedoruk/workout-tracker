import { type MuscleGroup } from '@/database';
import { ExerciseForm } from '@/routes/exercises/Exercise/ExerciseForm';
import { ExerciseList } from '@/routes/exercises/Exercise/ExerciseList';
import { type UseExercisesReturn } from '@/routes/exercises/ExerciseLibrary/hooks/useExercises';
import AddIcon from '@mui/icons-material/Add';
import { Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export type ExercisesSubViewProps = UseExercisesReturn & {
  readonly muscleGroups: MuscleGroup[];
};

export const ExercisesSubView = ({
  dialog,
  exercises,
  handleSave,
  muscleGroups,
  openCreate,
}: ExercisesSubViewProps) => {
  const navigate = useNavigate();

  return (
    <>
      <Stack
        direction="row"
        sx={{ justifyContent: 'flex-end', mb: 2 }}
      >
        <Button
          onClick={openCreate}
          startIcon={<AddIcon />}
          variant="contained"
        >
          Add exercise
        </Button>
      </Stack>

      <ExerciseList
        exercises={exercises}
        onNavigate={(ex) => navigate(`/exercises/${ex.id}`)}
      />

      <ExerciseForm
        initialValues={undefined}
        mode="create"
        muscleGroups={muscleGroups}
        onCancel={() => dialog.onClose()}
        onSave={handleSave}
        open={dialog.isOpen}
      />
    </>
  );
};
