# Contract: `src/database.ts` Public API

`database.ts` is the single import surface for all database operations consumed by React components and hooks. No component imports from `src/db/` subdirectories directly.

## Exports after refactor

### Initialisation

```ts
export { initDatabase } from './db/initDatabase';
export { MigrationError } from './db/initDatabase';
```

### Types

```ts
// Exercise
export type { Exercise, ExerciseClassification, MuscleGroup } from './db/entities/exercise/types';

// Routine
export type { Routine, RoutineWithExercises } from './db/entities/routine/types';
export type { RoutineExercise, LastExerciseSets } from './db/entities/routine-exercise/types';

// Workout
export type { WorkoutLog, WorkoutSet, WorkoutTableRow, WorkoutWithSets } from './db/entities/workout-log/types';
```

### Exercise operations (via `exerciseRepository` singleton)

```ts
export const listExercises: () => Promise<Exercise[]>
export const createExercise: (name: string, muscleGroupIds: number[], classification: ExerciseClassification) => Promise<number>
export const updateExercise: (id: number, name: string, muscleGroupIds: number[], classification: ExerciseClassification) => Promise<void>
export const deleteExercise: (id: number) => Promise<void>
```

### Muscle group operations (via `muscleGroupRepository` singleton)

```ts
export const listMuscleGroups: () => Promise<MuscleGroup[]>
export const createMuscleGroup: (name: string, color: string) => Promise<number>
export const updateMuscleGroup: (id: number, name: string, color: string) => Promise<void>
export const deleteMuscleGroup: (id: number) => Promise<void>
```

### Routine operations (via `routineRepository` + `routineExerciseRepository` singletons)

```ts
export const listRoutines: () => Promise<RoutineWithExercises[]>
export const getRoutineById: (id: number) => Promise<RoutineWithExercises | null>
export const createRoutine: (name: string) => Promise<number>
export const updateRoutine: (id: number, name: string) => Promise<void>
export const deleteRoutine: (id: number) => Promise<void>

export const addRoutineExercise: (routineId: number, exerciseName: string, suggestedSets: number, minReps: number, maxReps: number) => Promise<number>
export const updateRoutineExercise: (id: number, exerciseName: string, suggestedSets: number, minReps: number, maxReps: number) => Promise<void>
export const deleteRoutineExercise: (id: number, routineId: number) => Promise<void>
export const moveRoutineExercise: (id: number, routineId: number, direction: 'up' | 'down') => Promise<void>
export const getLastExerciseSets: (exerciseName: string, setCount: number) => Promise<LastExerciseSets>
```

### Workout operations (via `workoutLogRepository` singleton)

```ts
export const listWorkouts: () => Promise<WorkoutTableRow[]>
export const getWorkoutById: (id: number) => Promise<WorkoutWithSets | null>
export const createWorkout: (workoutDate: string, exerciseName: string, sets: Array<{ erm: null | number; reps: number; weight: null | number }>) => Promise<number>
export const updateWorkout: (id: number, workoutDate: string, exerciseName: string, sets: Array<{ erm: null | number; reps: number; weight: null | number }>) => Promise<void>
export const deleteWorkout: (id: number) => Promise<void>
```

### Settings operations (via `appSettingRepository` singleton)

```ts
export const getBodyWeight: () => Promise<number | null>
export const setBodyWeight: (kg: number) => Promise<void>
```

### Database utilities

```ts
export const exportDatabaseBytes: () => Promise<Uint8Array>
export const replaceDatabaseAndReload: (bytes: Uint8Array) => Promise<never>
export const __devRollback: (migrationName: string) => Promise<void>  // DEV only
```

## Invariants

- All exports are async (return `Promise<T>`).
- No component ever accesses the Drizzle `database` instance, the promiser, or `@sqlite.org/sqlite-wasm` directly.
- `initDatabase()` is called by `App.tsx` before rendering. By the time any export is called from a component, the DB is ready.
- `listWorkouts` uses a raw promiser MAX(CASE) pivot query — this is the only sanctioned use of raw SQL in the public API surface.
