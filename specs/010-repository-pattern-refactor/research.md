# Research: Database Repository Pattern Refactor

## Decision 1: Drizzle `.returning()` on sqlite-proxy

**Decision**: Use Drizzle's `.returning()` uniformly for all inserts that need the new row ID. Remove every `SELECT last_insert_rowid()` call.

**Rationale**: The codebase already proves this works — `routineHelpers.ts` (`createRoutine`, `addRoutineExercise`) and `database.ts` (`createWorkout`) all use `.returning({ id: ... })` as the primary path. The `last_insert_rowid` calls are defensive fallbacks left from before `.returning()` was confirmed to work. With `.returning()` proven, the fallbacks are dead code.

**Alternatives considered**:
- Keep `last_insert_rowid` as fallback — rejected; adds dead code and the double-query race condition risk is real under the Web Worker serialisation model.
- Use raw `INSERT ... RETURNING id` SQL via promiser — rejected; Drizzle's `.returning()` is already the preferred abstraction and keeps type safety.

---

## Decision 2: Drizzle transactions for multi-step operations

**Decision**: Replace manual `BEGIN` / `COMMIT` / `ROLLBACK` promiser calls with `database.transaction(async (tx) => { ... })`.

**Rationale**: The Drizzle sqlite-proxy adapter handles transaction lifecycle. `createExercise`, `updateExercise`, `deleteExercise`, `deleteRoutineExercise`, and `moveRoutineExercise` all currently use manual transaction management. `database.transaction()` reduces error-handling boilerplate and keeps all operations in the Drizzle abstraction layer.

**Alternatives considered**:
- Keep manual `BEGIN/COMMIT` — rejected; inconsistent with the rest of the codebase and more verbose.

---

## Decision 3: Migrate `exerciseHelpers.ts` from raw promiser to Drizzle

**Decision**: Convert all `exerciseHelpers.ts` operations to use the Drizzle `database` instance and its query builder.

**Rationale**: `exerciseHelpers.ts` is the only helper file that uses raw promiser for every query, including simple SELECTs. The complex JOIN in `listExercises` (exercise + exercise_muscle_group + muscle_group) is expressible via Drizzle's `.leftJoin()`. Converting keeps one consistent access pattern across all repositories.

**Alternatives considered**:
- Keep raw promiser in `ExerciseRepository` for the JOIN query — rejected; inconsistency with all other repositories and the JOIN is straightforward with Drizzle.
- Use two separate SELECT queries (current approach) and merge in JS — acceptable but Drizzle JOIN is more explicit.

**Implementation note**: The `listExercises` JOIN query becomes:
```ts
database
  .select({
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    classification: exercise.classification,
    createdAt: exercise.createdAt,
    muscleGroupId: muscleGroup.id,
    muscleGroupName: muscleGroup.name,
    muscleGroupColor: muscleGroup.color,
  })
  .from(exercise)
  .leftJoin(exerciseMuscleGroup, eq(exerciseMuscleGroup.exerciseId, exercise.id))
  .leftJoin(muscleGroup, eq(muscleGroup.id, exerciseMuscleGroup.muscleGroupId))
  .orderBy(asc(exercise.name))
```
Then group by exercise ID in JS — same as today but with typed rows.

---

## Decision 4: Schema split with `schema.ts` re-export barrel

**Decision**: Each entity's `schema.ts` exports its table(s). `src/db/schema.ts` becomes a re-export barrel: `export * from './entities/exercise/schema'`, etc. `drizzle.config.ts` remains unchanged.

**Rationale**: `drizzle.config.ts` points to `./src/db/schema.ts`. Changing it would require updating the drizzle-kit toolchain reference. A re-export barrel is a zero-config solution that lets drizzle-kit continue to discover all tables automatically.

**Alternatives considered**:
- Update `drizzle.config.ts` to glob all entity schema files — rejected; drizzle-kit's `schema` field supports arrays or globs but changing the config is unnecessary churn.

---

## Decision 5: `exerciseMuscleGroup` table placement

**Decision**: The `exerciseMuscleGroup` join table lives in `src/db/entities/exercise/schema.ts`. It is managed exclusively by `ExerciseRepository` and has no standalone repository.

**Rationale**: `exerciseMuscleGroup` has no independent lifecycle — rows are only created/deleted as a side effect of exercise create/update/delete. It is not an entity in the domain sense.

---

## Decision 6: `MuscleGroup` entity organisation

**Decision**: `muscleGroup` table is defined in `src/db/entities/muscle-group/schema.ts`. `MuscleGroupRepository` is a separate class from `ExerciseRepository`. The `MuscleGroup` type is defined in `src/db/entities/muscle-group/types.ts` and re-exported from `src/db/entities/exercise/types.ts` (since `Exercise` references `MuscleGroup[]`).

**Rationale**: Muscle groups are independently managed (create, list, update, delete) and appear on screens that do not load exercises. Separating the repository maintains the single-responsibility principle.

---

## Decision 7: `'assisted'` removal — schema vs migration

**Decision**: Update `src/db/schema.ts` (and the new `exercise/schema.ts`) to remove `'assisted'` from the Drizzle text enum and the check constraint. Do NOT run `drizzle-kit generate`. Do NOT produce a migration.

**Rationale**: No `classification = 'assisted'` rows exist. The DB check constraint continues to permit `'assisted'` at the SQL level (as a dead letter), but the TypeScript type system prevents it from being inserted. The actual constraint change is cosmetic — a future migration or cleanup sweep can remove it.

**Risk**: If an `'assisted'` row were to appear via direct DB manipulation, it would be invisible to the TypeScript layer. Acceptable given the confirmed absence.

---

## Decision 8: `WorkoutLog` and `WorkoutSet` repositories

**Decision**: `WorkoutLogRepository` owns all workout CRUD plus the `listWorkouts` pivot query. `WorkoutSetRepository` is a minimal class used internally by `WorkoutLogRepository`; it is not exported separately to `database.ts` (components have no reason to access sets independently of a workout).

**Rationale**: The pivot MAX(CASE...) query in `listWorkouts` must stay as raw SQL via the promiser (not expressible in Drizzle's query builder — noted in the existing codebase contract). `WorkoutLogRepository` wraps this alongside the Drizzle-based CRUD methods.

---

## Decision 9: `AppSettingRepository`

**Decision**: Convert `settingsHelpers.ts` to use Drizzle for both `getBodyWeight` and `setBodyWeight`. The validation logic (range checks, decimal check) stays in the repository method.

**Rationale**: `app_setting` is a simple key-value table. The upsert (`ON CONFLICT(key) DO UPDATE SET value = excluded.value`) is expressible as Drizzle's `.insert().onConflictDoUpdate(...)`.
