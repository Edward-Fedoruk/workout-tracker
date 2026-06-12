import { useExerciseDetail } from './hooks/useExerciseDetail';
import { ExerciseDetailView } from './views/ExerciseDetailView';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const ExerciseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const exerciseId = Number(id);
  const navigate = useNavigate();
  const hookValues = useExerciseDetail(exerciseId);

  useEffect(() => {
    hookValues.load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount to seed data
  }, []);

  return (
    <ExerciseDetailView
      {...hookValues}
      onBack={() => navigate(-1)}
    />
  );
};
