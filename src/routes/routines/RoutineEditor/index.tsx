import { useRoutineEditor } from './hooks/useRoutineEditor';
import { RoutineEditorView } from './views/RoutineEditorView';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const RoutineEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editor = useRoutineEditor();

  const routineId = id === undefined ? null : Number.parseInt(id, 10);

  useEffect(() => {
    const load = async () => {
      if (routineId !== null && Number.isNaN(routineId)) {
        navigate('/routines', { replace: true });
        return;
      }

      const found = await editor.init(routineId);
      if (!found) {
        navigate('/routines', { replace: true });
      }
    };

    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: runs once on mount to seed data
  }, []);

  return (
    <RoutineEditorView
      {...editor}
      onBack={() => navigate('/routines')}
    />
  );
};
