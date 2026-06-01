# Data Model: Database Repository Pattern Refactor

## Entity Map

```
exercise (1) ──< exercise_muscle_group >── (1) muscle_group
    │
    │ (denormalised name, not FK)
    ▼
workout_log (1) ──< workout_set
    
routine (1) ──< routine_exercise

app_setting  (standalone key-value)
```

---

## Entities

### Exercise

**File**: `src/db/entities/exercise/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, autoincrement |
| name | TEXT | NOT NULL |
| classification | TEXT | NOT NULL, default 'standard', CHECK IN ('standard', 'bodyweight') |
| created_at | TEXT | default CURRENT_TIMESTAMP |

**Note**: Check constraint in live DB still includes 'assisted' (not migrated). TypeScript type enforces two-value union.

**Inferred TS type** (`types.ts`):
```ts
export type ExerciseClassification = 'bodyweight' | 'standard';
export type ExerciseRow = typeof exercise.$inferSelect;
export type Exercise = ExerciseRow & { muscleGroups: MuscleGroup[] };
```

---

### ExerciseMuscleGroup (join table — no standalone repository)

**File**: `src/db/entities/exercise/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| exercise_id | INTEGER | NOT NULL, FK → exercise(id) ON DELETE CASCADE |
| muscle_group_id | INTEGER | NOT NULL, FK → muscle_group(id) ON DELETE CASCADE |

**PK**: composite (exercise_id, muscle_group_id)

---

### MuscleGroup

**File**: `src/db/entities/muscle-group/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, autoincrement |
| name | TEXT | NOT NULL |
| color | TEXT | NOT NULL, default '#757575' |

**Inferred TS type** (`types.ts`):
```ts
export type MuscleGroup = typeof muscleGroup.$inferSelect;
```

---

### Routine

**File**: `src/db/entities/routine/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, autoincrement |
| name | TEXT | NOT NULL, CHECK length ≤ 100 |
| created_at | TEXT | default CURRENT_TIMESTAMP |
| updated_at | TEXT | default CURRENT_TIMESTAMP |

**Inferred TS type** (`types.ts`):
```ts
export type Routine = typeof routine.$inferSelect;
export type RoutineWithExercises = Routine & { exercises: RoutineExercise[] };
```

---

### RoutineExercise

**File**: `src/db/entities/routine-exercise/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, autoincrement |
| routine_id | INTEGER | NOT NULL, FK → routine(id) ON DELETE CASCADE |
| exercise_name | TEXT | NOT NULL (denormalised) |
| position | INTEGER | NOT NULL, CHECK ≥ 1, UNIQUE with routine_id |
| suggested_sets | INTEGER | NOT NULL, CHECK 1–5 |
| min_reps | INTEGER | NOT NULL, CHECK 1–99 |
| max_reps | INTEGER | NOT NULL, CHECK 1–99 |

**Inferred TS type** (`types.ts`):
```ts
export type RoutineExercise = typeof routineExercise.$inferSelect;
export type LastExerciseSets = Array<{ reps: number; setNumber: number; weight: null | number }>;
```

---

### WorkoutLog

**File**: `src/db/entities/workout-log/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, autoincrement |
| exercise_name | TEXT | NOT NULL (intentionally denormalised — logs outlive exercise catalog) |
| workout_date | TEXT | NOT NULL (ISO 8601 date string) |
| created_at | TEXT | default CURRENT_TIMESTAMP |
| updated_at | TEXT | default CURRENT_TIMESTAMP |

**Inferred TS type** (`types.ts`):
```ts
export type WorkoutLog = typeof workoutLog.$inferSelect;
export type WorkoutWithSets = WorkoutLog & { sets: WorkoutSet[] };
export type WorkoutTableRow = { ... }; // manual type for the MAX(CASE) pivot query result
```

**Note**: `WorkoutTableRow` cannot be inferred from the schema — it is the result of a raw pivot SQL query and must remain a hand-written interface.

---

### WorkoutSet

**File**: `src/db/entities/workout-set/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, autoincrement |
| workout_id | INTEGER | NOT NULL, FK → workout_log(id) ON DELETE CASCADE |
| set_number | INTEGER | NOT NULL, CHECK 1–5, UNIQUE with workout_id |
| weight | REAL | nullable |
| reps | INTEGER | NOT NULL, CHECK > 0 |
| erm | REAL | nullable |

**Inferred TS type** (`types.ts`):
```ts
export type WorkoutSet = typeof workoutSet.$inferSelect;
```

---

### AppSetting

**File**: `src/db/entities/app-setting/schema.ts`

| Column | Type | Constraints |
|--------|------|-------------|
| key | TEXT | PK |
| value | TEXT | NOT NULL |

**Inferred TS type** (`types.ts`):
```ts
export type AppSetting = typeof appSetting.$inferSelect;
```

**Known keys**: `'body_weight'` (string representation of a float, 2 decimal places)

---

## Repository Responsibilities

| Repository | Methods | Notes |
|-----------|---------|-------|
| `ExerciseRepository` | `list()`, `create()`, `update()`, `delete()` | Manages `exercise_muscle_group` join rows internally; uses `database.transaction()` |
| `MuscleGroupRepository` | `list()`, `create()`, `update()`, `delete()` | No foreign-key cascade needed on list |
| `RoutineRepository` | `list()`, `getById()`, `create()`, `update()`, `delete()` | `list()` joins routine_exercise |
| `RoutineExerciseRepository` | `add()`, `update()`, `delete()`, `move()`, `getLastSets()` | `move()` uses transaction for position swap |
| `WorkoutLogRepository` | `list()`, `getById()`, `create()`, `update()`, `delete()` | `list()` uses raw promiser pivot query; `create()`/`update()` manage sets inline |
| `AppSettingRepository` | `getBodyWeight()`, `setBodyWeight()` | Validation logic lives in the repository method |
