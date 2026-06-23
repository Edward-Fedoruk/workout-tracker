---
description: "Task list for Redux Cache Layer"
---

# Tasks: Redux Cache Layer

**Input**: Design documents from `/specs/020-redux-cache-layer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/store-api.md, contracts/ui-hooks.md

**Tests**: No test runner is configured (Constitution Principle V) and none was requested. No test tasks are
generated. Verification is manual via `npm run preview` (see quickstart.md §4).

**Organization**: Tasks are grouped into a one-time foundation, then incremental per-entity vertical slices.

## Story coupling note (why phases look the way they do)

The spec's two P1 stories are **coupled by design**: US2 ("edits reflected everywhere") *must ship with* US1
("instant cached reads") — a cached read that goes stale after a direct write is worse than no cache. So a
cache for an entity is only correct once both its query (US1) and its tag-invalidating mutations (US2) exist.
Therefore each entity slice (Phases 3–7) delivers **US1 + US2 together** and is tagged `[US1][US2]`. US3
("first load + offline unchanged / no regression") is cross-cutting verification, gathered in Phase 8.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`/`[US2]`/`[US3]` — which spec user story the task serves
- All paths are repository-relative; this is a single-project SPA (`src/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the dependency the cache layer needs.

- [X] T001 Install Redux Toolkit + React-Redux: run `npm install @reduxjs/toolkit react-redux` (updates `package.json` + `package-lock.json`). No Vite/PWA/COOP-COEP config changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Stand up the store, the RTK Query api root, and the Provider. Nothing in any entity slice can be
built until this is in place.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete.

- [X] T002 Create the RTK Query api root in `src/store/api.ts`: `createApi` with `fakeBaseQuery<string>()`, `tagTypes: ['Exercise','MuscleGroup','Routine','Workout','Draft','Settings']`, `keepUnusedDataFor: 3600`, `refetchOnMountOrArgChange: false`, empty `endpoints: () => ({})` (per contracts/store-api.md global config).
- [X] T003 Create the store in `src/store/index.ts`: `configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (gDM) => gDM().concat(api.middleware) })`; export `type RootState = ReturnType<typeof store.getState>` and `type AppDispatch = typeof store.dispatch` (depends on T002).
- [X] T004 [P] Create typed hooks in `src/store/hooks.ts`: `useAppDispatch` and `useAppSelector` bound to `AppDispatch`/`RootState` (depends on T003).
- [X] T005 Wrap the app in the store provider in `src/main.tsx`: import `{ Provider }` from `react-redux` and `{ store }` from `@/store`, render `<Provider store={store}><App /></Provider>` (outermost) (depends on T003).
- [X] T006 Foundation checkpoint: run `npm run typecheck && npm run lint`; both MUST pass with the empty api wired in (depends on T002–T005).

**Checkpoint**: Store is live and empty. Entity slices can now be added incrementally.

---

## Phase 3: Exercises & Muscle Groups slice (P1) 🎯 MVP

**Goal**: Prove the whole caching contract on the simplest, highest-revisit lists — instant cached reads
(US1) plus write-through edits that update every view (US2).

**Independent Test**: Open the Exercise Library, navigate away and back → list appears instantly with no
spinner (SC-001). Create/rename/delete an exercise → it updates immediately and survives reload (US2/SC-003).
Repeat navigation triggers only one underlying read (SC-004, via Redux DevTools).

- [X] T007 [P] [US1] [US2] Create exercises endpoints in `src/store/entities/exercises.ts` via `api.injectEndpoints`: queries `listExercises`(void→`Exercise[]`), `getExercise`(id); mutations `createExercise`/`updateExercise`/`deleteExercise`; tags per contracts/store-api.md (provides/invalidates `Exercise`; `updateExercise` also invalidates `Workout`). Export generated hooks. Honor INV-1..4.
- [X] T008 [P] [US1] [US2] Create muscle-group endpoints in `src/store/entities/muscleGroups.ts`: query `listMuscleGroups`; mutations `createMuscleGroup`/`updateMuscleGroup`/`deleteMuscleGroup` (invalidate `MuscleGroup` + `Exercise`). Export hooks.
- [X] T009 [P] [US1] [US2] Migrate `src/routes/exercises/ExerciseLibrary/hooks/useExercises.ts` to `useListExercisesQuery` + `useCreateExerciseMutation` (+ update/delete if present); keep the duplicate-name check against cached `data`; preserve the return shape (HR-1, HR-4, HR-5). View file unchanged (depends on T007).
- [X] T010 [P] [US1] [US2] Migrate `src/routes/exercises/ExerciseLibrary/hooks/useMuscleGroups.ts` to the muscle-group query + mutation hooks; preserve return shape (depends on T008).

**Checkpoint**: MVP — exercises & muscle groups are cache-backed end-to-end. US1 + US2 demonstrable.

---

## Phase 4: Workouts & Settings-reads slice (P1)

**Goal**: Cache-back the workout log (and the settings reads it consumes), with write-through logging edits.

**Independent Test**: Open the workout log twice → instant on revisit. Add/edit/delete a workout → list
updates immediately, persists across reload. Body-weight-dependent eRM stays correct.

- [X] T011 [P] [US1] [US2] Create workout endpoints in `src/store/entities/workouts.ts`: queries `listWorkouts`, `listWorkoutsByExerciseName`(name), `getWorkout`(id); mutations `createWorkout`/`updateWorkout`/`deleteWorkout` (invalidate `Workout`). Export hooks.
- [X] T012 [P] [US1] [US2] Create settings endpoints in `src/store/entities/settings.ts`: queries `getBodyWeight`, `getExerciseNamesInTables`; mutations `setBodyWeight` (invalidate `Settings` + `Workout`), `setExerciseNamesInTables` (invalidate `Settings`). Export hooks.
- [X] T013 [US1] [US2] Migrate `src/routes/workouts/hooks/useWorkouts.ts` to `useListWorkoutsQuery` + `useListExercisesQuery` + `useGetBodyWeightQuery` + `useGetExerciseNamesInTablesQuery` and the workout mutations; combine loading flags (HR-7); preserve return shape and error strings (HR-4) (depends on T011, T012, T007).
- [X] T014 [US1] [US2] Migrate `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts` to `useGetExerciseQuery` + `useListWorkoutsByExerciseNameQuery` + update/delete exercise mutations; preserve return shape (depends on T007, T011).

**Checkpoint**: Workout log + exercise detail are cache-backed; body-weight edits propagate via tags.

---

## Phase 5: Settings page slice (P1)

**Goal**: Re-point the settings screens onto the cached settings endpoints (created in Phase 4).

**Independent Test**: Change body weight / toggle name display → value persists across navigation and reload;
dependent workout/analytics views reflect body-weight change.

- [X] T015 [P] [US1] [US2] Migrate `src/routes/settings/hooks/useBodyWeight.ts` to `useGetBodyWeightQuery` + `useSetBodyWeightMutation`; preserve return shape (depends on T012).
- [X] T016 [P] [US1] [US2] Migrate `src/routes/settings/hooks/useDisplaySettings.ts` to `useGetExerciseNamesInTablesQuery` + `useSetExerciseNamesInTablesMutation`; preserve return shape (depends on T012).

> `src/routes/settings/hooks/useDatabaseActions.ts` is intentionally NOT migrated — export/import/reload still
> call `@/database` utilities directly; the import path's `location.reload()` clears the store (FR-010).

**Checkpoint**: All settings flows cache-backed.

---

## Phase 6: Routines & Draft slice (P1)

**Goal**: Cache-back routines (including nested routine-exercises) and the active workout draft, with
write-through for all routine/draft edits.

**Independent Test**: Reorder/add/remove routine exercises and edit a routine → changes reflect immediately
and persist; the draft survives navigation and is cleared on finish.

- [X] T017 [P] [US1] [US2] Create routine endpoints in `src/store/entities/routines.ts`: queries `listRoutines`, `getRoutine`(id); mutations `createRoutine`/`updateRoutine`/`deleteRoutine` and the routine-exercise mutations `addRoutineExercise`/`updateRoutineExercise`/`deleteRoutineExercise`/`moveRoutineExercise`/`reorderRoutineExercises`/`setRoutineExerciseSetCount` — ALL invalidating `Routine` (routine-exercises are nested, no separate cache key per data-model.md). Export hooks.
- [X] T018 [P] [US1] [US2] Create draft endpoints in `src/store/entities/draft.ts`: query `getDraft`; mutations `saveDraft`/`clearDraft` (invalidate `Draft`). Export hooks.
- [X] T019 [US1] [US2] Migrate `src/routes/routines/RoutineList/hooks/useRoutines.ts` to `useListRoutinesQuery` + `useGetDraftQuery` + create/delete routine mutations; preserve return shape (depends on T017, T018).
- [X] T020 [US1] [US2] Migrate `src/routes/routines/RoutineWorkout/hooks/useRoutineStructure.ts` to `useGetRoutineQuery` + routine-exercise mutations; preserve return shape (depends on T017).
- [X] T021 [US1] [US2] Migrate `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts` to `useGetRoutineQuery` + `useGetDraftQuery` + `saveDraft`/`clearDraft` + `createWorkout` mutations; keep `getLastExerciseSets` as a direct `@/database` call (documented exception, HR-6); preserve return shape (depends on T017, T018, T011).

**Checkpoint**: Routine building + draft persistence are cache-backed.

---

## Phase 7: Analytics slice (P1) — validates FR-013

**Goal**: Cache-back the read-only analytics views and prove derived views reflect cached source edits via
shared tags (FR-013).

**Independent Test**: Open analytics → cached on revisit. Then log/edit a workout elsewhere → analytics
charts and the `/log` strength banner update without a manual refresh.

- [X] T022 [P] [US1] Create analytics endpoints in `src/store/entities/analytics.ts`: queries `listSetRowsInRange`({startIso,endIso}) providing `['Workout','Exercise','Settings']`, and `listMuscleGroupSetRowsInRange`({startIso,endIso}) providing `['Workout','MuscleGroup']`. Read-only, no mutations. Export hooks.
- [X] T023 [P] [US1] Migrate the Analytics hooks `src/routes/exercises/Analytics/hooks/useExerciseParameterChart.ts`, `useStrengthProgressChart.ts`, `useMuscleGroupRose.ts` to the analytics query hooks (+ `useListExercisesQuery`/`useListMuscleGroupsQuery` where they need names/colors); preserve return shapes (depends on T022, T007, T008).
- [X] T024 [P] [US1] Migrate `src/routes/workouts/StrengthBanner/hooks/useStrengthProgress.ts` to `useListSetRowsInRangeQuery`; preserve return shape (depends on T022).
- [ ] T025 [US1] [US2] Verify FR-013/AC-3: edit a workout → workouts list AND every open analytics view + the strength banner update with no manual refresh (shared `Workout` tag) (depends on T013, T023, T024).

**Checkpoint**: All data sets are cache-backed; cross-tag invalidation proven.

---

## Phase 8: User Story 3 — First load & offline unchanged (P2)

**Goal**: Verify the cache layer preserved the app's local-first guarantees and introduced no regression.

**Independent Test**: Cold-start offline → data loads and is editable; edits persist across reload; importing
a different DB shows no stale data.

- [ ] T026 [US3] Offline verification (FR-011/AC-6): in `npm run preview`, throttle to Offline and exercise the primary read + edit flow on every migrated page; all succeed.
- [ ] T027 [US3] DB-replacement verification (FR-010): Settings → import a different `.sqlite3`; confirm the app reloads and no entity from the previous DB remains in any view.
- [ ] T028 [US3] No-regression verification (FR-014): for each page, confirm data, ordering, and outcomes match pre-feature behavior; only redundant loading states on revisit are gone.

**Checkpoint**: Local-first + offline guarantees intact; no behavioral regression.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T029 [P] Remove dead code from migrated hooks: delete leftover `useState`/`refresh()` fetch logic; confirm no migrated hook reads cached data via `@/database` directly except the documented `getLastExerciseSets` (HR-2, HR-6) across `src/routes/**/hooks/`.
- [X] T030 [P] Type-safety audit: confirm no `as any` / `as unknown` and no `@ts-ignore` in `src/store/**` or migrated hooks; endpoint arg/result types derive from `@/database` signatures (Constitution IX, INV-4).
- [X] T031 Run `npm run lint && npm run typecheck`; resolve any findings (repo stop-hook enforces this before commit).
- [ ] T032 Run the quickstart.md §4 validation end-to-end (instant revisit, load-once, read-your-writes, write-through failure, offline, DB import) and confirm SC-001..SC-006.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (P1)** → no deps.
- **Foundational (P2)** → depends on Setup; **blocks all entity slices**.
- **Entity slices (Phases 3–7)** → each depends only on Foundational + its own endpoint task(s). Cross-slice
  read reuse: Phase 4/7 reuse `useListExercisesQuery` (T007); Phase 5 reuses settings endpoints (T012);
  Phase 6 reuses `createWorkout` (T011). Otherwise slices are independent and could be reordered.
- **US3 verification (Phase 8)** → run after the slices whose flows it exercises (effectively after Phase 7).
- **Polish (Phase 9)** → last.

### Within an entity slice

- Endpoint file (`src/store/entities/<entity>.ts`) before the hook migration(s) that import its generated
  hooks (importing a generated hook triggers `injectEndpoints` — no central registry needed).
- Hook migration leaves the view file untouched (HR-1 / AC-4).

### Parallel opportunities

- T004 is `[P]` within Foundational.
- Endpoint files across entities are independent: **T007, T008, T011, T012, T017, T018, T022 can all be
  written in parallel** once Foundational is done (different files).
- Hook migrations marked `[P]` touch different files and can run together once their endpoint task is done
  (e.g., T009 ∥ T010; T015 ∥ T016; T023 ∥ T024).
- Polish T029 ∥ T030.

---

## Parallel Example: Phase 3 (MVP)

```bash
# After Foundational (T006), create both endpoint files in parallel:
Task: "Create exercises endpoints in src/store/entities/exercises.ts"      # T007
Task: "Create muscle-group endpoints in src/store/entities/muscleGroups.ts" # T008

# Then migrate both hooks in parallel (each depends on its endpoint file):
Task: "Migrate useExercises.ts to query+mutation hooks"      # T009 (after T007)
Task: "Migrate useMuscleGroups.ts to query+mutation hooks"   # T010 (after T008)
```

---

## Implementation Strategy

### MVP first (Phase 3)

1. Phase 1 Setup → 2. Phase 2 Foundational (CRITICAL, blocks all) → 3. Phase 3 Exercises & Muscle Groups.
4. **STOP and VALIDATE**: instant revisit + write-through on the exercise library (US1+US2 on one slice).
5. Demo — the caching contract is proven end-to-end on the simplest entity.

### Incremental delivery

Each subsequent slice (Workouts → Settings → Routines/Draft → Analytics) is an independently shippable
increment: old direct-`@/database` hooks and migrated cache hooks coexist safely (both call the same
durable helpers), so the app stays correct after every phase. Finish with US3 verification + polish.

---

## Notes

- `[P]` = different files, no incomplete dependency.
- Every endpoint wraps `@/database` helpers only — never the worker/`promiser`/`dbId` (Constitution II / INV-1).
- The store is never persisted; SQLite/OPFS remains the only durable store (FR-008/FR-009, Constitution I).
- Keep each `src/store/entities/*.ts` file under ~200 lines (Constitution VIII); split if an entity grows.
- Commit after each task or slice; `npm run lint` + `npm run typecheck` must pass before each commit.
