# Tasks: Custom Exercise Library

**Input**: Design documents from `specs/005-custom-exercises/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/database.ts.md ✅, quickstart.md ✅

**Tests**: No test tasks — none requested; constitution Principle V prohibits ad-hoc test tooling.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Confirm Tooling)

**Purpose**: Confirm Drizzle tooling is accessible before schema work begins.

- [ ] T001 Verify `npx drizzle-kit` resolves and `src/db/schema.ts` exists; note the current migration count in `drizzle/` to determine the next migration filename

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, migration with seed data, DB helpers, and re-export barrel. Everything in Phase 3+ depends on this phase completing first.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add `exercise`, `muscleGroup`, and `exerciseMuscleGroup` Drizzle table definitions to `src/db/schema.ts` — `exercise(id, name, created_at)`, `muscle_group(id, name)`, `exercise_muscle_group(exercise_id FK→exercise CASCADE, muscle_group_id FK→muscle_group CASCADE, PK composite)`
- [ ] T003 Run `npx drizzle-kit generate` to produce the migration SQL file in `drizzle/` (filename: `000N_exercise_library.sql` where N follows current sequence); confirm FK and cascade clauses appear in generated SQL
- [ ] T004 Append `INSERT OR IGNORE INTO muscle_group (name) VALUES ...` for all 12 muscle groups and `INSERT OR IGNORE INTO exercise (name) VALUES ...` + `INSERT OR IGNORE INTO exercise_muscle_group ...` for all 24 exercises with their assignments to the migration file generated in T003 (use exact names from spec.md seed data table)
- [ ] T005 Create `src/db/exerciseHelpers.ts`: implement `listExercises()`, `createExercise(name, muscleGroupIds)`, `updateExercise(id, name, muscleGroupIds)`, and `deleteExercise(id)` per `contracts/database.ts.md` — each helper calls `initDatabase()` at top, uses module-level `dbId`, wraps multi-statement writes in `BEGIN`/`COMMIT`, propagates name changes to `workout_log` and `routine_exercise` in same transaction
- [ ] T006 Extend `src/db/exerciseHelpers.ts` with `listMuscleGroups()`, `createMuscleGroup(name)`, `updateMuscleGroup(id, name)`, and `deleteMuscleGroup(id)`; export `Exercise` and `MuscleGroup` types per contract
- [ ] T007 Add re-exports of all 8 helpers and both types from `src/db/exerciseHelpers.ts` to `src/database.ts` barrel so UI components never import exerciseHelpers directly

**Checkpoint**: Foundation ready — DB tables will be created and seeded on next app launch; all helpers callable via `src/database.ts`.

---

## Phase 3: User Story 1 — Pick Exercise from Dropdown (Priority: P1) 🎯 MVP

**Goal**: Replace freetext exercise name fields in WorkoutForm and RoutineEditor with a searchable exercise dropdown loaded from the library. Seed data makes it immediately useful.

**Independent Test**: Open the routine builder or workout log screen. Tap/click the exercise field. A dropdown appears with all 24 seeded exercises in alphabetical order. Type a partial name — list filters in real time. Select an exercise — it is recorded and the dropdown closes.

### Implementation for User Story 1

- [ ] T008 [US1] Create `src/components/exercises/ExercisePicker.tsx`: MUI Autocomplete wrapping `Exercise[]` prop, case-insensitive substring filtering on `option.name`, 44×44px minimum touch target on the input, closes on selection and calls `onChange(exercise)`
- [ ] T009 [P] [US1] Replace the exercise name `TextField` in `src/components/WorkoutForm.tsx` with `ExercisePicker`: load exercises via `listExercises()` in a `useEffect` on mount, pass result as `exercises` prop, map selected `Exercise` to the exercise name stored on the log entry
- [ ] T010 [P] [US1] Replace the exercise name `TextField` in `src/components/routines/RoutineEditor.tsx` with `ExercisePicker`: same load pattern as T009 (separate `listExercises()` call scoped to this component's mount); map selected `Exercise` to the routine slot's exercise name

**Checkpoint**: User Story 1 fully functional — workout logging and routine building both use the exercise picker populated with seeded data.

---

## Phase 4: User Story 2 — Add an Exercise (Priority: P2)

**Goal**: Users can create new exercises (name + ≥1 muscle group) from the Exercise Library screen. New exercises are immediately available in the picker.

**Independent Test**: Open the Exercise Library (third tab). Tap "Add exercise". Enter a unique name, select at least one muscle group, save. Picker in WorkoutForm and RoutineEditor now includes the new exercise. Close and reopen the app — exercise persists.

### Implementation for User Story 2

- [ ] T011 [US2] Create `src/components/exercises/ExerciseForm.tsx`: dialog with a name `TextField` and a muscle group multi-select (MUI Autocomplete with `multiple`); accepts `mode: 'create' | 'edit'`, `initialValues?`, `muscleGroups: MuscleGroup[]`, `onSave(name, muscleGroupIds)`, `onCancel`; validate name non-empty/trimmed/1–100 chars and at least one muscle group selected before calling `onSave`; show inline error messages for empty name, duplicate name (passed as prop), and zero muscle groups
- [ ] T012 [US2] Create `src/components/exercises/ExerciseLibrary.tsx`: container component owning `exercises: Exercise[]` and `muscleGroups: MuscleGroup[]` state; loads both lists on mount via `listExercises()` and `listMuscleGroups()`; renders an "Add exercise" FAB/button; opens `ExerciseForm` in create mode; calls `createExercise()` on save, refreshes exercises list, closes dialog; handles duplicate-name detection by checking the current list before calling helper
- [ ] T013 [US2] Add an "Exercises" tab as the third top-level tab in `src/App.tsx`: extend `ActiveView` union type with `'exercises'`, add the tab to the navigation bar, render `<ExerciseLibrary />` when `activeView === 'exercises'`

**Checkpoint**: User Story 2 fully functional — users can add exercises with muscle groups; new exercises appear in picker immediately; data persists across reloads.

---

## Phase 5: User Story 3 — Manage Exercises and Muscle Groups (Priority: P3)

**Goal**: Full CRUD on exercises and muscle groups via the Exercise Library screen. Rename and delete are safe — existing log entries preserved, routine slots cleared on exercise delete.

**Independent Test**: Open the Exercise Library. Rename an exercise — new name appears in the picker. Delete an exercise — it leaves the picker; past log entries unchanged. Add a muscle group — available when editing exercises. Delete a muscle group — removed from affected exercises, those exercises remain in the library.

### Implementation for User Story 3

- [ ] T014 [P] [US3] Create `src/components/exercises/ExerciseList.tsx`: renders a list of `Exercise` rows; each row shows name, muscle group chips, edit icon (opens `ExerciseForm` in edit mode), delete icon (confirmation prompt then calls `deleteExercise(id)`); shows a warning badge on exercises with zero muscle groups; accepts `exercises: Exercise[]`, `onEdit(exercise)`, `onDelete(id)` props
- [ ] T015 [P] [US3] Create `src/components/exercises/MuscleGroupList.tsx`: renders a list of `MuscleGroup` rows with inline rename (inline edit field or dialog) and delete (confirmation then `deleteMuscleGroup(id)`); accepts `muscleGroups: MuscleGroup[]`, `onRename(id, name)`, `onDelete(id)` props
- [ ] T016 [P] [US3] Create `src/components/exercises/MuscleGroupForm.tsx`: small dialog with a name `TextField`; used for both add and rename; validates name non-empty/1–50 chars; accepts `mode: 'create' | 'edit'`, `initialName?`, `onSave(name)`, `onCancel`; duplicate name error passed as prop
- [ ] T017 [US3] Extend `src/components/exercises/ExerciseLibrary.tsx` to complete the full management UI: add sub-tabs ("Exercises" / "Muscle Groups") inside the screen; render `ExerciseList` and `MuscleGroupList` in the appropriate sub-tab; wire `updateExercise` for rename (including duplicate check), `deleteExercise`, `createMuscleGroup`, `updateMuscleGroup`, `deleteMuscleGroup`; refresh relevant lists after each mutation; extend `ExerciseForm` props to support edit mode with `initialValues`

**Checkpoint**: All three user stories fully functional — full CRUD on exercises and muscle groups, referential integrity maintained as designed.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify non-functional requirements, edge-case UX, and end-to-end correctness across all stories.

- [ ] T018 [P] Verify 44×44px minimum touch targets on all interactive elements in `ExercisePicker.tsx`, `ExerciseList.tsx`, and `MuscleGroupList.tsx` at 320px viewport width; fix any elements that fall short
- [ ] T019 [P] Verify exercises and muscle groups render in strict alphabetical order in `ExercisePicker.tsx`, `ExerciseList.tsx`, and `MuscleGroupList.tsx`; confirm `listExercises()` and `listMuscleGroups()` SQL has `ORDER BY name COLLATE NOCASE ASC`
- [ ] T020 Run quickstart.md manual validation end-to-end: seed data present on first launch, picker works in WorkoutForm and RoutineEditor, add/rename/delete exercise, add/rename/delete muscle group, verify log entry preservation after exercise delete, verify routine slot clearing after exercise delete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion; can run in parallel with Phase 3 if staffed
- **US3 (Phase 5)**: Depends on Phase 2 + Phase 4 completion (uses `ExerciseLibrary.tsx` and `ExerciseForm.tsx`)
- **Polish (Phase 6)**: Depends on all user story phases completing

### Within Foundational Phase (Phase 2)

```
T002 (schema) → T003 (generate migration) → T004 (add seeds) → T005 (exercise helpers) → T006 (muscle group helpers) → T007 (re-export)
```

### Within User Story Phases

- **Phase 3**: T008 → [T009 ‖ T010] (T009 and T010 parallel, both depend on T008)
- **Phase 4**: T011 → T012 → T013
- **Phase 5**: [T014 ‖ T015 ‖ T016] → T017

### Parallel Opportunities

| Story | Parallel Group |
|---|---|
| US1 | T009 and T010 after T008 completes |
| US3 | T014, T015, T016 all start together after Phase 4 |
| Polish | T018 and T019 can run together |

---

## Parallel Example: User Story 3

```
# After Phase 4 completes, launch in parallel:
Task T014: Create ExerciseList.tsx (src/components/exercises/ExerciseList.tsx)
Task T015: Create MuscleGroupList.tsx (src/components/exercises/MuscleGroupList.tsx)
Task T016: Create MuscleGroupForm.tsx (src/components/exercises/MuscleGroupForm.tsx)

# Then:
Task T017: Wire CRUD in ExerciseLibrary.tsx (depends on T014, T015, T016)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T007) — **CRITICAL, blocks everything**
3. Complete Phase 3: US1 (T008–T010)
4. **STOP and VALIDATE**: Picker appears in WorkoutForm and RoutineEditor with all 24 exercises
5. Ship/demo if ready

### Incremental Delivery

1. Setup + Foundational → DB tables seeded, helpers accessible
2. US1 → Exercise picker live in existing screens (MVP)
3. US2 → Users can add exercises via Exercise Library tab
4. US3 → Full CRUD management
5. Polish → Touch targets, ordering, edge cases

---

## Notes

- No tests — no runner configured; constitution Principle V.
- All SQL uses `?` placeholders (constitution Principle IV) — no string interpolation.
- All helpers call `initDatabase()` at top of function; no second promiser instantiation (Principle II).
- `ExercisePicker` is presentational — parent loads exercises, passes as prop (no self-fetching).
- `ExerciseLibrary.tsx` is the only container in `src/components/exercises/`; all siblings are presentational.
- If `ExerciseLibrary.tsx` exceeds ~200 lines, extract state into `useExerciseLibrary` custom hook (Principle VIII).
- On exercise delete: `deleteExercise` fetches name first, removes `routine_exercise` rows, then deletes exercise (cascade handles `exercise_muscle_group`).
- On muscle group delete: exercises with zero remaining groups are left in library; UI shows warning badge (T014); they remain valid in DB.
