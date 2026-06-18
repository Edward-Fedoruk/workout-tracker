import { type MuscleGroup } from '@/database';
import { ExerciseForm } from '@/routes/exercises/Exercise/ExerciseForm';
import { ExerciseList } from '@/routes/exercises/Exercise/ExerciseList';
import { type UseExercisesReturn } from '@/routes/exercises/ExerciseLibrary/hooks/useExercises';
import { useNavigate } from 'react-router-dom';

export type ExercisesSubViewProps = UseExercisesReturn & {
  readonly muscleGroups: MuscleGroup[];
};

export const ExercisesSubView = ({
  dialog,
  exercises,
  handleSave,
  muscleGroups,
}: ExercisesSubViewProps) => {
  const navigate = useNavigate();

  return (
    <>
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
