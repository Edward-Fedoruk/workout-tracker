import { getDatabaseId, getPromiser } from './db/driver';
import { appSettingRepository } from './db/entities/app-setting/repository';
import { exerciseRepository } from './db/entities/exercise/repository';
import { type ExerciseClassification } from './db/entities/exercise/types';
import { muscleGroupRepository } from './db/entities/muscle-group/repository';
import { routineExerciseRepository } from './db/entities/routine-exercise/repository';
import { routineWorkoutDraftRepository } from './db/entities/routine-workout-draft/repository';
import { type StoredDraftData } from './db/entities/routine-workout-draft/types';
import { routineRepository } from './db/entities/routine/repository';
import { workoutLogRepository } from './db/entities/workout-log/repository';
import { writeDatabaseFile } from './db/importDatabaseFile';
import { initDatabase } from './db/initDatabase';

export type {
  Exercise,
  ExerciseClassification,
  MuscleGroup,
} from './db/entities/exercise/types';

export type {
  LastExerciseSets,
  RoutineExercise,
} from './db/entities/routine-exercise/types';
export type {
  RoutineWorkoutDraft,
  StoredDraftData,
  StoredSetValues,
} from './db/entities/routine-workout-draft/types';
export type {
  Routine,
  RoutineWithExercises,
} from './db/entities/routine/types';
export type {
  WorkoutLog,
  WorkoutSet,
  WorkoutTableRow,
  WorkoutWithSets,
} from './db/entities/workout-log/types';
export { initDatabase, MigrationError } from './db/initDatabase';

// Exercise operations
export const listExercises = () => exerciseRepository.list();
export const getExerciseById = (id: number) => exerciseRepository.getById(id);
export const createExercise = (
  name: string,
  muscleGroupIds: number[],
  classification: ExerciseClassification,
  imageFilename?: null | string,
) =>
  exerciseRepository.create(
    name,
    muscleGroupIds,
    classification,
    imageFilename,
  );
export const updateExercise = (
  id: number,
  name: string,
  muscleGroupIds: number[],
  classification: ExerciseClassification,
  imageFilename?: null | string,
) =>
  exerciseRepository.update(
    id,
    name,
    muscleGroupIds,
    classification,
    imageFilename,
  );
export const deleteExercise = (id: number) => exerciseRepository.delete(id);

// Muscle group operations
export const listMuscleGroups = () => muscleGroupRepository.list();
export const createMuscleGroup = (name: string, color: string) =>
  muscleGroupRepository.create(name, color);
export const updateMuscleGroup = (id: number, name: string, color: string) =>
  muscleGroupRepository.update(id, name, color);
export const deleteMuscleGroup = (id: number) =>
  muscleGroupRepository.delete(id);

// Routine operations
export const listRoutines = () => routineRepository.list();
export const getRoutineById = (id: number) => routineRepository.getById(id);
export const createRoutine = (name: string) => routineRepository.create(name);
export const updateRoutine = (id: number, name: string) =>
  routineRepository.update(id, name);
export const deleteRoutine = (id: number) => routineRepository.delete(id);

export const addRoutineExercise = (
  routineId: number,
  exerciseName: string,
  suggestedSets: number,
  minReps: number,
  maxReps: number,
) =>
  routineExerciseRepository.add(
    routineId,
    exerciseName,
    suggestedSets,
    minReps,
    maxReps,
  );
export const updateRoutineExercise = (
  id: number,
  exerciseName: string,
  suggestedSets: number,
  minReps: number,
  maxReps: number,
) =>
  routineExerciseRepository.update(
    id,
    exerciseName,
    suggestedSets,
    minReps,
    maxReps,
  );
export const deleteRoutineExercise = (id: number, routineId: number) =>
  routineExerciseRepository.delete(id, routineId);
export const moveRoutineExercise = (
  id: number,
  routineId: number,
  direction: 'down' | 'up',
) => routineExerciseRepository.move(id, routineId, direction);
export const getLastExerciseSets = (exerciseName: string, setCount: number) =>
  routineExerciseRepository.getLastSets(exerciseName, setCount);

// Workout operations
export const listWorkouts = () => workoutLogRepository.list();
export const listWorkoutsByExerciseName = (exerciseName: string) =>
  workoutLogRepository.listByExerciseName(exerciseName);
export const getWorkoutById = (id: number) => workoutLogRepository.getById(id);
export const createWorkout = (
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ erm: null | number; reps: number; weight: null | number }>,
) => workoutLogRepository.create(workoutDate, exerciseName, sets);
export const updateWorkout = (
  id: number,
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ erm: null | number; reps: number; weight: null | number }>,
) => workoutLogRepository.update(id, workoutDate, exerciseName, sets);
export const deleteWorkout = (id: number) => workoutLogRepository.delete(id);

// Routine workout draft operations
export const saveDraft = (routineId: number, data: StoredDraftData) =>
  routineWorkoutDraftRepository.save(routineId, data);
export const getDraft = () => routineWorkoutDraftRepository.get();
export const clearDraft = () => routineWorkoutDraftRepository.clear();

// Settings operations
export const getBodyWeight = () => appSettingRepository.getBodyWeight();
export const setBodyWeight = (kg: number) =>
  appSettingRepository.setBodyWeight(kg);
export const getExerciseNamesInTables = () =>
  appSettingRepository.getExerciseNamesInTables();
export const setExerciseNamesInTables = (enabled: boolean) =>
  appSettingRepository.setExerciseNamesInTables(enabled);

// Database utilities
export const exportDatabaseBytes = async (): Promise<Uint8Array> => {
  await initDatabase();
  const promiser = await getPromiser();
  const result = await promiser('export', { dbId: getDatabaseId() });
  const bytes = result.result.byteArray;
  if (bytes instanceof Uint8Array) {
    return bytes;
  }

  return new Uint8Array(bytes as ArrayBuffer);
};

export const replaceDatabaseAndReload = async (
  bytes: Uint8Array,
): Promise<void> => {
  await initDatabase();

  const headerBytes = bytes.slice(0, 16);
  const headerText = new TextDecoder('latin1').decode(headerBytes);

  if (!headerText.includes('SQLite format 3')) {
    throw new Error('Selected file is not a SQLite database.');
  }

  const promiser = await getPromiser();

  try {
    await promiser('close', { dbId: getDatabaseId() });
  } catch {
    // Log but don't abort — reload will reset the worker
  }

  // The OPFS write runs in a worker via createSyncAccessHandle: that is the only
  // write path available on iOS Safari, where the main thread lacks createWritable.
  if (navigator.storage) {
    await writeDatabaseFile(bytes);
  }

  location.reload();
};

// eslint-disable-next-line canonical/id-match, unicorn/prevent-abbreviations, @typescript-eslint/naming-convention -- contract specifies __devRollback as the exported name
export const __devRollback = async (migrationName: string): Promise<void> => {
  if (!import.meta.env.DEV) {
    return;
  }

  await initDatabase();
  const promiser = await getPromiser();
  const databaseId = getDatabaseId();

  const downFiles = import.meta.glob('@/../../drizzle/*_down.sql', {
    eager: true,
    import: 'default',
    query: '?raw',
  }) as Record<string, string>;

  const base = migrationName.replace(/\.sql$/u, '');
  const downKey = Object.keys(downFiles).find((key) =>
    key.includes(`${base}_down.sql`),
  );
  const downSql = downKey ? downFiles[downKey] : null;

  if (downSql) {
    const statements = downSql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await promiser('exec', { dbId: databaseId, sql: statement });
    }
  }

  await promiser('exec', {
    bind: [migrationName],
    dbId: databaseId,
    sql: 'DELETE FROM __drizzle_migrations WHERE name = ?',
  });
};
