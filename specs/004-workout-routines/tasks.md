# Tasks: Workout Routines

**Input**: Design documents from `/specs/004-workout-routines/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/database.ts.md ✅

**Tests**: No test runner is configured (Constitution Principle V). No test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Create the `routines/` component directory and shared utility file.

- [x] T001 Create directory `src/components/routines/` and add `src/components/routines/routineUtils.ts` with pure validation helpers: `validateRoutineName(name: string): string | null` (null = valid, string = error message) and `validateExercise(name: string, sets: number, reps: number): { name?: string; sets?: string; reps?: string }`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema, migration, and app-level navigation state. Must complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `routine` and `routine_exercise` table definitions to `src/db/schema.ts` per `data-model.md` (import `check`, `unique` from `drizzle-orm/sqlite-core`; add `Routine`, `RoutineExercise` exports)
- [x] T003 Run `npx drizzle-kit generate` from repo root to produce the migration SQL file under `drizzle/`; verify the generated SQL contains `CREATE TABLE IF NOT EXISTS routine` and `CREATE TABLE IF NOT EXISTS routine_exercise`
- [x] T004 Add `ActiveView` discriminated union type and `activeView` state to `App.tsx`; add a top-level layout that renders MUI `<Tabs>` (Log | Routines) when `activeView.type` is `'log'` or `'routines'`, and renders a full-page view (no tab bar) when `activeView.type` is `'edit-routine'` or `'start-routine'`; leave the full-page slot as a placeholder `<Box>` for now

**Checkpoint**: App builds with tab bar visible; DB schema contains both new tables on next load.

---

## Phase 3: User Story 1 — Manage Routines (Priority: P1) 🎯 MVP

**Goal**: Users can create, rename, and delete named routines from a flat list on the Routines tab.

**Independent Test**: Open the Routines tab, create a routine named "Test Day", verify it appears in the list. Rename it to "Push Day", verify the new name persists. Delete it, verify it disappears.

- [x] T005 Add `Routine`, `RoutineWithExercises`, `RoutineExercise` type exports and implement `listRoutines(): Promise<RoutineWithExercises[]>`, `getRoutineById(id: number): Promise<RoutineWithExercises | null>`, `createRoutine(name: string): Promise<number>`, `updateRoutine(id: number, name: string): Promise<void>`, `deleteRoutine(id: number): Promise<void>` in `src/database.ts` (see `contracts/database.ts.md`); extract to `src/db/routineHelpers.ts` and re-export if `database.ts` exceeds ~200 lines
- [x] T006 [P] [US1] Create presentational component `src/components/routines/RoutineCard.tsx` — props: `routine: RoutineWithExercises`, `onEdit: () => void`, `onDelete: () => void`, `onStart: () => void`; renders routine name, exercise count chip, and three action buttons (Edit, Delete, Start); Start button disabled with tooltip when routine has no exercises
- [x] T007 [US1] Create container `src/components/routines/RoutineList.tsx` — fetches `listRoutines()` on mount, renders a list of `RoutineCard` components plus an "Add Routine" button; inline name-input dialog for creating a new routine (validates non-empty, ≤100 chars using `routineUtils.validateRoutineName`); confirm-delete MUI `Dialog`; calls `createRoutine` / `deleteRoutine` from `database.ts`; accepts `onEdit: (routineId: number) => void` and `onStart: (routineId: number) => void` props (navigation callbacks)
- [x] T008 [US1] Wire `RoutineList` into `App.tsx`: render it when `activeView.type === 'routines'`; pass `onEdit` and `onStart` callbacks that call `setActiveView`

**Checkpoint**: Routines tab fully functional for create/delete. Edit and Start navigate to placeholder views.

---

## Phase 4: User Story 2 — Manage Exercises Within a Routine (Priority: P1)

**Goal**: Within a routine, users can add, edit, delete, and reorder exercises using up/down arrow buttons.

**Independent Test**: Open a routine in the editor, add three exercises ("Bench Press" 3×8, "Squat" 4×5, "Row" 3×10). Move "Squat" up, verify order is Squat → Bench → Row. Edit "Bench Press" to 4×6, verify saved. Delete "Row", verify remaining order. Reload and confirm all changes persisted.

- [x] T009 Add `addRoutineExercise`, `updateRoutineExercise`, `deleteRoutineExercise`, `moveRoutineExercise` to `src/database.ts` (or `src/db/routineHelpers.ts`) per `contracts/database.ts.md`; `deleteRoutineExercise` and `moveRoutineExercise` must execute inside a `BEGIN`/`COMMIT` transaction via raw promiser to keep re-indexing / position swap atomic
- [x] T010 [P] [US2] Create presentational component `src/components/routines/ExerciseRow.tsx` — props: `exercise: RoutineExercise`, `isFirst: boolean`, `isLast: boolean`, `onMoveUp: () => void`, `onMoveDown: () => void`, `onEdit: () => void`, `onDelete: () => void`; renders exercise name, suggested sets × reps, up/down icon buttons (disabled at boundaries), edit and delete icon buttons; min touch target 44×44 px per Constitution VI
- [x] T011 [US2] Create container `src/components/routines/RoutineEditor.tsx` — props: `routineId: number | null` (null = new), `onBack: () => void`; fetches routine via `getRoutineById` (or starts empty for new); renders editable routine name field at top; list of `ExerciseRow` components; "Add Exercise" button that opens an inline form for exercise name (non-empty), suggested sets (1–5), suggested reps (1–99) validated via `routineUtils.validateExercise`; calls `createRoutine` / `updateRoutine` / `addRoutineExercise` / `updateRoutineExercise` / `deleteRoutineExercise` / `moveRoutineExercise`; back button calls `onBack`
- [x] T012 [US2] Wire `RoutineEditor` into `App.tsx`: render it when `activeView.type === 'edit-routine'`; pass `routineId` from `activeView.routineId` and `onBack={() => setActiveView({ type: 'routines' })}`; update `RoutineList.onEdit` to pass the real `routineId` (not null) via `setActiveView({ type: 'edit-routine', routineId })`; "Add Routine" button sets `activeView` to `{ type: 'edit-routine', routineId: null }`

**Checkpoint**: Full routine CRUD including exercise management works end-to-end. Reorder and delete persist across reload.

---

## Phase 5: User Story 3 — Start a Workout from a Routine (Priority: P2)

**Goal**: Tapping "Start" on a routine opens a full-page workout form pre-filled with last logged weights, and submitting creates workout log entries.

**Independent Test**: Create a routine "Pull Day" with two exercises. Log a workout manually for one of those exercises with known weights. Tap "Start" on "Pull Day" — verify the logged exercise's weight/reps appear as input placeholders. Fill in all sets and submit. Verify two new entries appear in the Log tab with today's date and correct exercise names.

- [x] T013 Add `LastExerciseSets` type and `getLastExerciseSets(exerciseName: string, setCount: number): Promise<LastExerciseSets>` to `src/database.ts` (or `src/db/routineHelpers.ts`) using the raw SQL correlated subquery from `contracts/database.ts.md`; bind array must use positional `?` placeholders (no interpolation)
- [x] T014 [P] [US3] Create presentational component `src/components/routines/RoutineWorkoutExercise.tsx` — props: `exercise: RoutineExercise`, `prefill: LastExerciseSets`, `onChange: (sets: Array<{ weight: string; reps: string }>) => void`; renders exercise name and suggested sets as reference label; one input row per `exercise.suggestedSets` with weight (kg) and reps fields; pre-fills placeholder attribute from `prefill` matched by set index; validates that filled rows have weight > 0 and reps > 0 (rows left entirely blank are allowed — no log entry created)
- [x] T015 [US3] Create container `src/components/routines/RoutineWorkoutForm.tsx` — props: `routineId: number`, `onBack: () => void`; fetches routine via `getRoutineById`; for each exercise calls `getLastExerciseSets(exercise.exerciseName, exercise.suggestedSets)` to get prefill data; renders a `RoutineWorkoutExercise` per routine exercise; collects form values; on submit calls `createWorkout(today, exercise.exerciseName, filledSets)` for each exercise that has at least one filled set (weight > 0 and reps > 0); after all inserts calls `onBack`; shows a loading state during submit; shows error message on failure
- [x] T016 [US3] Wire `RoutineWorkoutForm` into `App.tsx`: render it when `activeView.type === 'start-routine'`; pass `routineId` and `onBack={() => setActiveView({ type: 'routines' })}`

**Checkpoint**: Full routine-based workout flow works. Submitted exercises appear in the Log tab. Blank exercises produce no log entries.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Typecheck, lint, mobile validation, and golden-path verification.

- [x] T017 Run `npm run typecheck` and `npm run lint` — fix all errors and warnings; ensure no `any`, `as unknown as X`, or `@ts-ignore` were introduced (Constitution IX)
- [ ] T018 [P] Verify mobile layout at 375 px viewport width in browser DevTools for all new views: Routines list, Routine Editor, Routine Workout Form — confirm no horizontal scroll, all interactive targets ≥ 44×44 px, tab bar remains usable (Constitution VI)
- [ ] T019 Run the full golden path from `quickstart.md` manually: create routine → reorder exercises → delete exercise → start workout with prefill → verify log entries → edit routine → verify log unchanged → delete routine

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2; best started after Phase 3 (T005 must be done; T006 can run in parallel with T009/T010)
- **Phase 5 (US3)**: Depends on Phase 2 and T005; best started after Phase 4 (T014 can run in parallel with T013)
- **Phase 6 (Polish)**: Depends on all prior phases complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no inter-story dependencies
- **US2 (P1)**: T009 and T010 can start in parallel with Phase 3; T011 needs T009+T010; T012 needs T011 and T008
- **US3 (P2)**: Needs T005 (for `getRoutineById`) and T008 (routines list with Start button); T013+T014 can run in parallel

### Parallel Opportunities Within Stories

**Phase 3 (US1)**: T005 and T006 can run in parallel (different files).

**Phase 4 (US2)**: T009 and T010 can run in parallel (different files). T011 needs both.

**Phase 5 (US3)**: T013 and T014 can run in parallel (different files). T015 needs both.

**Phase 6**: T017 and T018 can run in parallel.

---

## Parallel Example: User Story 2

```
Parallel start:
  Task T009: DB helpers (deleteRoutineExercise, moveRoutineExercise) in src/database.ts
  Task T010: ExerciseRow.tsx presentational component in src/components/routines/

Sequential after both complete:
  Task T011: RoutineEditor.tsx container (uses T009 helpers + T010 component)
  Task T012: Wire RoutineEditor into App.tsx navigation
```

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**critical blocker**)
3. Complete Phase 3: US1 — Routine list with create/delete
4. Complete Phase 4: US2 — Exercise management within editor
5. **STOP and VALIDATE**: Both P1 stories fully testable
6. Demo or ship if P2 (US3) is not immediately needed

### Incremental Delivery

1. Setup + Foundational → tab bar appears, DB migrated
2. US1 → users can manage routines (no exercises yet)
3. US2 → users can build out routine exercises
4. US3 → users can log workouts from routines
5. Each phase additive — previous functionality unaffected

---

## Notes

- `database.ts` may approach the 200-line soft limit — extract routine helpers to `src/db/routineHelpers.ts` and re-export from `database.ts` if needed (Constitution VIII)
- Transactions (`BEGIN`/`COMMIT`) for `deleteRoutineExercise` and `moveRoutineExercise` must use the raw `getPromiser()` / `getDatabaseId()` pattern — Drizzle ORM does not expose SQLite-WASM transactions directly
- Prefill uses `placeholder` HTML attribute, not `defaultValue` — the field remains controlled (empty string until user types), and the placeholder disappears on focus
- The existing `WorkoutTable`, `WorkoutForm`, and `WorkoutDataActions` components are **unchanged**
