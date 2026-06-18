import {
  type ExerciseClassification,
  type LastExerciseSets,
  type RoutineExercise,
} from '@/database';
import { formatRepRange } from '@/routes/routines/routineUtilities';
import { type FormValues } from '@/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema';
import { RoutineWorkoutSetRow } from '@/routes/routines/RoutineWorkout/views/RoutineWorkoutSetRow';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
} from 'react-hook-form';

export type RoutineExerciseCardProps = {
  readonly classification: ExerciseClassification;
  readonly errors: FieldErrors<FormValues>;
  readonly exercise: RoutineExercise;
  readonly exerciseIndex: number;
  readonly imageFilename?: string | undefined;
  readonly onAddSet: () => void;
  readonly onAutoSave: () => void;
  readonly onDelete: () => void;
  readonly onEdit: () => void;
  readonly onNavigateToExercise?: () => void;
  readonly onRemoveSet: () => void;
  readonly prefill: LastExerciseSets;
  readonly register: UseFormRegister<FormValues>;
  readonly watch: UseFormWatch<FormValues>;
};

export const RoutineExerciseCard = ({
  classification,
  errors,
  exercise,
  exerciseIndex,
  imageFilename,
  onAddSet,
  onAutoSave,
  onDelete,
  onEdit,
  onNavigateToExercise,
  onRemoveSet,
  prefill,
  register,
  watch,
}: RoutineExerciseCardProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exercise.id });

  const isBodyWeight = classification === 'bodyweight';
  const sets = watch(`exercises.${exerciseIndex}.sets`);
  const allCompleted =
    Array.isArray(sets) &&
    sets.length > 0 &&
    sets.every((set) => set.completed === true);

  return (
    <Card
      ref={setNodeRef}
      sx={{
        bgcolor: allCompleted ? '#81c78433' : 'background.paper',
        mb: 2,
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        transition: transition
          ? `${transition}, background-color 0.2s`
          : 'background-color 0.2s',
      }}
      variant="outlined"
    >
      <CardContent>
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2 }}>
          <Box
            aria-label="Drag to reorder"
            sx={{
              alignItems: 'center',
              alignSelf: 'stretch',
              color: 'text.secondary',
              cursor: 'grab',
              display: 'flex',
              justifyContent: 'center',
              minHeight: 44,
              minWidth: 44,
              touchAction: 'none',
            }}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon />
          </Box>
          <Avatar
            alt={exercise.exerciseName}
            src={
              imageFilename
                ? `${import.meta.env.BASE_URL}exercises/${imageFilename}`
                : undefined
            }
            sx={{ height: 48, width: 48 }}
          >
            <FitnessCenterIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {onNavigateToExercise ? (
              <ButtonBase
                onClick={onNavigateToExercise}
                sx={{ display: 'block', textAlign: 'left' }}
              >
                <Typography
                  sx={{ fontWeight: 'bold' }}
                  variant="subtitle1"
                >
                  {exercise.exerciseName}
                </Typography>
              </ButtonBase>
            ) : (
              <Typography
                sx={{ fontWeight: 'bold' }}
                variant="subtitle1"
              >
                {exercise.exerciseName}
              </Typography>
            )}
            <Typography
              color="text.secondary"
              variant="body2"
            >
              Target: {exercise.suggestedSets} ×{' '}
              {formatRepRange(exercise.minReps, exercise.maxReps)}
            </Typography>
          </Box>
          <IconButton
            aria-label="Exercise options"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          onClose={() => setMenuAnchor(null)}
          open={Boolean(menuAnchor)}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onEdit();
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onDelete();
            }}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        </Menu>

        {Array.from({ length: exercise.suggestedSets }, (_unused, setIndex) => (
          <RoutineWorkoutSetRow
            errors={errors}
            exerciseIndex={exerciseIndex}
            isBodyWeight={isBodyWeight}
            key={setIndex}
            onAutoSave={onAutoSave}
            prefill={prefill}
            register={register}
            setIndex={setIndex}
            striped={setIndex % 2 === 1}
            watch={watch}
          />
        ))}

        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            disabled={exercise.suggestedSets >= 5}
            onClick={onAddSet}
            size="small"
            variant="outlined"
          >
            + Set
          </Button>
          <Button
            disabled={exercise.suggestedSets <= 1}
            onClick={onRemoveSet}
            size="small"
            variant="outlined"
          >
            − Set
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
