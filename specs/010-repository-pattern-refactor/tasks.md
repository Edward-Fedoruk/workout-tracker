# Tasks: Database Repository Pattern Refactor & Component Cleanup

**Input**: Design documents from `/specs/010-repository-pattern-refactor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by phase. Phases 2–5 deliver User Story 1 (repository pattern). Phase 6 delivers US2 (classification), Phase 7 verifies US3 (RETURNING), Phase 8 delivers US4 (components).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Create the directory skeleton before any files are written.

- [X] T001 Create directory tree `src/db/entities/` with subdirectories: `exercise/`, `muscle-group/`, `routine/`, `routine-exercise/`, `workout-log/`, `workout-set/`, `app-setting/`

---

## Phase 2: Foundational — Schema Split

**Purpose**: Move every table definition from `src/db/schema.ts` into its own entity `schema.ts` file, then convert `src/db/schema.ts` into a re-export barrel. This must complete before repositories can be written.

**⚠️ CRITICAL**: Repositories import from entity schema files. All of Phase 3+ is blocked until this phase passes `npm run typecheck`.

- [X] T002 [P] Create `src/db/entities/exercise/schema.ts` — move `exercise` and `exerciseMuscleGroup` table definitions from `src/db/schema.ts`; import `muscleGroup` from `../muscle-group/schema` for the FK reference
- [X] T003 [P] Create `src/db/entities/muscle-group/schema.ts` — move `muscleGroup` table definition from `src/db/schema.ts`
- [X] T004 [P] Create `src/db/entities/routine/schema.ts` — move `routine` table definition from `src/db/schema.ts`
- [X] T005 [P] Create `src/db/entities/routine-exercise/schema.ts` — move `routineExercise` table definition from `src/db/schema.ts`; import `routine` from `../routine/schema` for the FK reference
- [X] T006 [P] Create `src/db/entities/workout-log/schema.ts` — move `workoutLog` table definition from `src/db/schema.ts`
- [X] T007 [P] Create `src/db/entities/workout-set/schema.ts` — move `workoutSet` table definition from `src/db/schema.ts`; import `workoutLog` from `../workout-log/schema` for the FK reference
- [X] T008 [P] Create `src/db/entities/app-setting/schema.ts` — move `appSetting` table definition from `src/db/schema.ts`
- [X] T009 Rewrite `src/db/schema.ts` as a re-export barrel: `export * from './entities/exercise/schema'`, etc. for all 7 entities — `drizzle.config.ts` must remain unchanged
- [X] T010 Run `npm run typecheck` — confirm zero errors before proceeding

**Checkpoint**: Schema split complete. All existing imports of `src/db/schema.ts` continue to work via the barrel.

---

## Phase 3: User Story 1 — Typed Entity Interfaces

**Goal**: Each entity has a `types.ts` that exports types inferred from its Drizzle schema. No hand-written types except `WorkoutTableRow` and `Exercise` (which compose inferred types).

**Independent Test**: Every type in the old helper files (`Exercise`, `MuscleGroup`, `Routine`, `RoutineExercise`, `WorkoutLog`, `WorkoutSet`, `LastExerciseSets`) can be imported from the new entity `types.ts` files without TypeScript errors.

- [X] T011 [P] [US1] Create `src/db/entities/muscle-group/types.ts` — `export type MuscleGroup = typeof muscleGroup.$inferSelect`
- [X] T012 [P] [US1] Create `src/db/entities/exercise/types.ts` — `ExerciseClassification = 'bodyweight' | 'standard'`; `ExerciseRow = typeof exercise.$inferSelect`; `Exercise = ExerciseRow & { muscleGroups: MuscleGroup[] }` (import `MuscleGroup` from `../muscle-group/types`)
- [X] T013 [P] [US1] Create `src/db/entities/routine/types.ts` — `Routine = typeof routine.$inferSelect`; `RoutineWithExercises = Routine & { exercises: RoutineExercise[] }` (import `RoutineExercise` from `../routine-exercise/types`)
- [X] T014 [P] [US1] Create `src/db/entities/routine-exercise/types.ts` — `RoutineExercise = typeof routineExercise.$inferSelect`; `LastExerciseSets = Array<{ reps: number; setNumber: number; weight: null | number }>`
- [X] T015 [P] [US1] Create `src/db/entities/workout-log/types.ts` — `WorkoutLog = typeof workoutLog.$inferSelect`; `WorkoutSet` imported from `../workout-set/types`; `WorkoutWithSets = WorkoutLog & { sets: WorkoutSet[] }`; hand-written `WorkoutTableRow` interface (16 columns for the MAX(CASE) pivot result)
- [X] T016 [P] [US1] Create `src/db/entities/workout-set/types.ts` — `WorkoutSet = typeof workoutSet.$inferSelect`
- [X] T017 [P] [US1] Create `src/db/entities/app-setting/types.ts` — `AppSetting = typeof appSetting.$inferSelect`

---

## Phase 4: User Story 1 — Repository Classes

**Goal**: One repository class per entity containing all data-access methods. Classes reference the module-level `database` object (from `../../orm`) directly — no constructor arguments, no `initDatabase()` calls.

**Independent Test**: Each repository file compiles without errors and exports a singleton instance. A developer can import `exerciseRepository.list()` from the entity file and it works.

- [X] T018 [P] [US1] Create `src/db/entities/exercise/repository.ts` — `ExerciseRepository` class with `list()`, `create()`, `update()`, `delete()`; migrate all logic from `src/db/exerciseHelpers.ts`; convert all raw promiser calls to Drizzle query builder; use `database.transaction()` for multi-step operations; use `.returning({ id: exercise.id })` for insert (no `last_insert_rowid`); export singleton `export const exerciseRepository = new ExerciseRepository()`
- [X] T019 [P] [US1] Create `src/db/entities/muscle-group/repository.ts` — `MuscleGroupRepository` class with `list()`, `create()`, `update()`, `delete()`; migrate logic from `src/db/exerciseHelpers.ts`; convert `createMuscleGroup` to use `.returning()` (remove `last_insert_rowid`); export singleton `export const muscleGroupRepository = new MuscleGroupRepository()`
- [X] T020 [P] [US1] Create `src/db/entities/routine/repository.ts` — `RoutineRepository` class with `list()`, `getById()`, `create()`, `update()`, `delete()`; migrate logic from `src/db/routineHelpers.ts`; `create()` uses `.returning()` with no fallback (remove `last_insert_rowid` fallback path); export singleton `export const routineRepository = new RoutineRepository()`
- [X] T021 [P] [US1] Create `src/db/entities/routine-exercise/repository.ts` — `RoutineExerciseRepository` class with `add()`, `update()`, `delete()`, `move()`, `getLastSets()`; migrate logic from `src/db/routineHelpers.ts`; `add()` uses `.returning()` with no fallback; `delete()` and `move()` use `database.transaction()`; export singleton `export const routineExerciseRepository = new RoutineExerciseRepository()`
- [X] T022 [P] [US1] Create `src/db/entities/workout-set/repository.ts` — thin `WorkoutSetRepository` class used internally by `WorkoutLogRepository`; methods: `insertMany()`, `deleteByWorkoutId()`; export singleton `export const workoutSetRepository = new WorkoutSetRepository()`
- [X] T023 [P] [US1] Create `src/db/entities/workout-log/repository.ts` — `WorkoutLogRepository` class with `list()`, `getById()`, `create()`, `update()`, `delete()`; migrate logic from `src/database.ts` workout functions; `list()` keeps raw promiser MAX(CASE) pivot query (not expressible in Drizzle); `create()` uses `.returning()` with no fallback and delegates set inserts to `workoutSetRepository`; export singleton `export const workoutLogRepository = new WorkoutLogRepository()`
- [X] T024 [P] [US1] Create `src/db/entities/app-setting/repository.ts` — `AppSettingRepository` class with `getBodyWeight()`, `setBodyWeight()`; migrate logic from `src/db/settingsHelpers.ts`; convert upsert to Drizzle `.insert().onConflictDoUpdate()`; validation logic stays in repository; export singleton `export const appSettingRepository = new AppSettingRepository()`

---

## Phase 5: User Story 1 — Barrel Rewire & Cleanup

**Goal**: `src/database.ts` re-exports all operations from the new repository singletons. Old helper files are deleted. Build passes.

**Independent Test**: Running `npm run build` produces zero TypeScript and ESLint errors. The app boots and the isDbReady gate resolves normally.

- [X] T025 [US1] Rewrite `src/database.ts` — remove all inline workout function implementations; import and re-export named functions from each repository singleton (matching the existing export names exactly per `contracts/database-api.md`); retain `initDatabase`, `MigrationError`, `exportDatabaseBytes`, `replaceDatabaseAndReload`, `__devRollback`; retain all type re-exports (sourced from entity `types.ts` files now)
- [X] T026 [US1] Delete `src/db/exerciseHelpers.ts`, `src/db/routineHelpers.ts`, `src/db/settingsHelpers.ts`
- [X] T027 [US1] Run `npm run build` — fix any TypeScript or import errors before proceeding

**Checkpoint**: User Story 1 complete. Developer can navigate to `src/db/entities/exercise/` and find everything related to exercises in three focused files.

---

## Phase 6: User Story 2 — Collapse 'assisted' into 'bodyweight'

**Goal**: `ExerciseClassification` is `'bodyweight' | 'standard'` everywhere. No `'assisted'` value exists in source code.

**Independent Test**: `grep -rn "'assisted'" src/` returns zero results.

- [X] T028 [P] [US2] Update `src/db/entities/exercise/schema.ts` — change Drizzle text enum to `['standard', 'bodyweight']`; update the check constraint SQL to `IN ('standard', 'bodyweight')`; do NOT run `drizzle-kit generate` (no migration required per spec)
- [X] T029 [P] [US2] Update `src/db/entities/exercise/types.ts` — set `ExerciseClassification = 'bodyweight' | 'standard'`
- [X] T030 [P] [US2] Update `src/utils/erm.ts` — remove `'assisted'` from the local `ExerciseClassification` type (or import from entity types); simplify `computeEffectiveWeight` — the three-way branch becomes two-way: `'standard'` uses logged weight, everything else (only `'bodyweight'` now) adds body weight
- [X] T031 [P] [US2] Update `src/routes/workouts/workoutFormUtilities.ts` — remove the `// assisted` branch from `validateWeight`; the `'bodyweight'` branch already covers the correct validation logic
- [X] T032 [P] [US2] Update `src/routes/exercises/ExerciseForm.tsx` — remove the "Assisted" `<MenuItem>` option from the classification dropdown
- [X] T033 [US2] Run `grep -rn "'assisted'" src/` — confirm zero results; fix any remaining occurrences

**Checkpoint**: User Story 2 complete. Classification is binary.

---

## Phase 7: User Story 3 — Verify RETURNING Pattern

**Goal**: Zero occurrences of `last_insert_rowid` remain in source files.

**Independent Test**: `grep -rn "last_insert_rowid" src/` returns zero results.

- [X] T034 [US3] Run `grep -rn "last_insert_rowid" src/` — should be zero after Phase 5; if any hits remain, fix them by replacing the two-step pattern with `.returning()` per `quickstart.md`
- [X] T035 [US3] Run `npm run typecheck` to confirm no type regressions from the RETURNING conversions

**Checkpoint**: User Story 3 complete. All inserts that return IDs use a single statement.

---

## Phase 8: User Story 4 — React Component Refactor

**Goal**: Every component follows `create-component` scaffold conventions: named export, `<Name>Props` interface, container/presentational separation (constitution Principle VII), imports from `src/database.ts` only.

**Pre-task**: Resolve duplicate ExerciseLibrary files before refactoring individual components.

**Independent Test**: Every component file has a named export, a `<ComponentName>Props` interface, and imports data only from `src/database.ts`.

- [X] T036 [US4] Resolve duplicate `src/routes/exercises/ExerciseLibrary/` files — determine canonical location between flat files (`ExerciseLibraryView.tsx`, `ExercisesSubView.tsx`, `MuscleGroupsSubView.tsx`) and `views/` subfolder; delete duplicates; update `index.tsx` imports accordingly

### Shared components

- [X] T037 [P] [US4] Refactor `src/components/ConfirmDialog.tsx` using create-component conventions (named export, `ConfirmDialogProps` interface)
- [X] T038 [P] [US4] Refactor `src/components/DialogActionButtons.tsx` using create-component conventions
- [X] T039 [P] [US4] Refactor `src/components/FormDialog.tsx` using create-component conventions

### Layout components

- [X] T040 [P] [US4] Refactor `src/AppLayout.tsx` using create-component conventions

### Exercise route components

- [X] T041 [P] [US4] Refactor `src/routes/exercises/ExerciseForm.tsx` using create-component conventions — container: form state, DB calls to `database.ts`; presentational: form fields
- [X] T042 [P] [US4] Refactor `src/routes/exercises/ExerciseList.tsx` using create-component conventions
- [X] T043 [P] [US4] Refactor `src/routes/exercises/ExercisePicker.tsx` using create-component conventions
- [X] T044 [P] [US4] Refactor `src/routes/exercises/MuscleGroupForm.tsx` using create-component conventions
- [X] T045 [P] [US4] Refactor `src/routes/exercises/MuscleGroupList.tsx` using create-component conventions
- [X] T046 [P] [US4] Refactor `src/routes/exercises/ExerciseLibrary/index.tsx`, `ExerciseLibraryView.tsx`, `ExercisesSubView.tsx`, `MuscleGroupsSubView.tsx` using create-component conventions

### Routine route components

- [X] T047 [P] [US4] Refactor `src/routes/routines/RoutineCard.tsx` using create-component conventions
- [X] T048 [P] [US4] Refactor `src/routes/routines/RoutineEditor.tsx` using create-component conventions — container: routine state, DB calls; presentational: editor UI
- [X] T049 [P] [US4] Refactor `src/routes/routines/RoutineList.tsx` using create-component conventions
- [X] T050 [P] [US4] Refactor `src/routes/routines/RoutineWorkoutExercise.tsx`, `RoutineWorkoutForm.tsx`, `ExerciseRow.tsx` using create-component conventions

### Workout route components

- [X] T051 [P] [US4] Refactor `src/routes/workouts/WorkoutTable.tsx` using create-component conventions — container: data fetching, delete/edit handlers; presentational: table rendering
- [X] T052 [P] [US4] Refactor `src/routes/workouts/WorkoutForm.tsx` using create-component conventions — container: form state, set management, DB calls; presentational: form fields
- [X] T053 [P] [US4] Refactor `src/routes/workouts/WorkoutSetInputRow.tsx`, `WorkoutSetRow.tsx`, `WorkoutRowActions.tsx` using create-component conventions
- [X] T054 [P] [US4] Refactor `src/routes/workouts/DeleteWorkoutDialog.tsx`, `MigrationErrorDialog.tsx` using create-component conventions

### Settings route components

- [X] T055 [P] [US4] Refactor `src/routes/settings/SettingsPage.tsx`, `DatabaseActions.tsx`, `ConfirmImportDialog.tsx` using create-component conventions

**Checkpoint**: User Story 4 complete. Every component is consistent and predictable.

---

## Phase 9: Polish & Verification

**Purpose**: Full build validation, regression check, and spec success criteria sign-off.

- [X] T056 Run `npm run build && npm run lint` — fix any remaining errors
- [X] T057 Smoke test all features in `npm run preview`: workout logging (create/edit/delete), exercise library (CRUD, muscle groups), routines (CRUD, exercises, move), settings (export/import DB)
- [X] T058 Verify all 6 success criteria from spec.md: SC-001 (no `last_insert_rowid`), SC-002 (no `'assisted'`), SC-003 (one schema/repo/types per entity), SC-004 (clean build), SC-005 (no regressions), SC-006 (component conventions)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Schema Split)**: Depends on Phase 1
- **Phase 3 (Types)**: Depends on Phase 2 (imports entity schemas)
- **Phase 4 (Repositories)**: Depends on Phase 3 (uses entity types)
- **Phase 5 (Rewire)**: Depends on Phase 4 (imports all repository singletons)
- **Phase 6 (US2 Classification)**: Depends on Phase 5 (exercise entity files must exist)
- **Phase 7 (US3 Verification)**: Depends on Phase 5 (repositories must be written)
- **Phase 8 (US4 Components)**: Depends on Phase 5 (database.ts API must be stable); T036 must precede T046
- **Phase 9 (Polish)**: Depends on all phases complete

### Within Each Phase

- All `[P]` tasks in a phase can run simultaneously
- Non-`[P]` tasks within a phase run sequentially

### Parallel Opportunities

```bash
# Phase 2 — all 7 entity schema files simultaneously:
T002 exercise/schema.ts  |  T003 muscle-group/schema.ts  |  T004 routine/schema.ts
T005 routine-exercise/schema.ts  |  T006 workout-log/schema.ts
T007 workout-set/schema.ts  |  T008 app-setting/schema.ts

# Phase 3 — all 7 types files simultaneously:
T011 muscle-group/types  |  T012 exercise/types  |  T013 routine/types
T014 routine-exercise/types  |  T015 workout-log/types  |  T016 workout-set/types  |  T017 app-setting/types

# Phase 4 — all 7 repositories simultaneously:
T018 ExerciseRepository  |  T019 MuscleGroupRepository  |  T020 RoutineRepository
T021 RoutineExerciseRepository  |  T022 WorkoutSetRepository  |  T023 WorkoutLogRepository  |  T024 AppSettingRepository

# Phase 8 — all component refactors simultaneously (after T036):
T037–T039 shared  |  T040 layout  |  T041–T046 exercises  |  T047–T050 routines
T051–T054 workouts  |  T055 settings
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — Phases 1–5)

1. Phase 1: Create directory tree (T001)
2. Phase 2: Split schema files (T002–T010)
3. Phase 3: Write types (T011–T017)
4. Phase 4: Write repositories (T018–T024)
5. Phase 5: Rewire database.ts and delete helpers (T025–T027)
6. **STOP and VALIDATE**: Build passes, app boots, all features work

### Incremental Delivery

- After Phase 5: Repository pattern done → developer experience improved
- After Phase 6: Classification collapse done → `'assisted'` gone
- After Phase 7: RETURNING verified → clean insert pattern confirmed
- After Phase 8: Components consistent → codebase navigation improved

---

## Summary

| Phase | Story | Task count | Parallelizable |
|-------|-------|------------|---------------|
| 1 Setup | — | 1 | — |
| 2 Schema Split | — | 9 | 7 parallel |
| 3 US1 Types | US1 | 7 | 7 parallel |
| 4 US1 Repositories | US1 | 7 | 7 parallel |
| 5 US1 Rewire | US1 | 3 | — |
| 6 US2 Classification | US2 | 6 | 5 parallel |
| 7 US3 Verify RETURNING | US3 | 2 | — |
| 8 US4 Components | US4 | 20 | 19 parallel (after T036) |
| 9 Polish | — | 3 | — |
| **Total** | | **58** | |
