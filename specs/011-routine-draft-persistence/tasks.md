# Tasks: Routine Draft Persistence

**Input**: Design documents from `specs/011-routine-draft-persistence/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: No test runner configured (Constitution Principle V) — no test tasks generated.

**Organization**: Tasks grouped by user story. Phase 2 (Foundational) is a hard prerequisite for all story phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Create the new entity folder structure.

- [X] T001 Create folder `src/db/entities/routine-workout-draft/` (three empty files: `schema.ts`, `types.ts`, `repository.ts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New SQLite entity, migration, and database facade. Nothing in Phases 3–5 can begin until T007 is done.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Implement Drizzle table definition for `routine_workout_draft` (singleton, `CHECK (id = 1)`, FK to `routine` with `ON DELETE CASCADE`) in `src/db/entities/routine-workout-draft/schema.ts`
- [X] T003 [P] Define `StoredSetValues`, `StoredDraftData`, and `RoutineWorkoutDraft` TypeScript types in `src/db/entities/routine-workout-draft/types.ts`
- [X] T004 Add re-export `export * from './entities/routine-workout-draft/schema'` in `src/db/schema.ts` (depends on T002)
- [X] T005 Implement `RoutineWorkoutDraftRepository` with `save` (upsert on `id = 1`), `get`, and `clear` methods in `src/db/entities/routine-workout-draft/repository.ts` (depends on T002, T003)
- [X] T006 Run `npx drizzle-kit generate` to produce migration SQL in `drizzle/` — verify the output contains `CREATE TABLE routine_workout_draft` with `ON DELETE CASCADE` (depends on T002, T004)
- [X] T007 Add `saveDraft`, `getDraft`, `clearDraft` exports to `src/database.ts` forwarding to `routineWorkoutDraftRepository` (depends on T005)

**Checkpoint**: Database layer is ready. All three facade functions are callable from hooks.

---

## Phase 3: User Story 1 — Resume Interrupted Routine Workout (Priority: P1) 🎯 MVP

**Goal**: Auto-save form values to the draft on every change; restore them when the same routine is opened again (including after a page reload).

**Independent Test**: Start a routine workout, enter weight/reps for two exercises, reload the page, navigate to Routines, tap the same routine — verify the form opens with all previously entered values intact.

- [X] T008 [US1] Extend `useRoutineWorkout.load()` to call `getDraft()` after fetching the routine; if `draft.routineId === routineId`, build a `defaultValues` map keyed by `routineExerciseId` with `null → NaN` conversion for each set row — pass into the form's `defaultValues` in `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`
- [X] T009 [US1] Add `react-hook-form` `watch()` observer + debounced `useEffect` (500 ms) that serialises current form values into `StoredDraftData` (NaN → null) and calls `saveDraft(routineId, data)` in `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`
- [X] T010 [US1] Add `clearDraft()` call inside `submit()` immediately after all `createWorkout` calls succeed (before returning `true`) in `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`

**Checkpoint**: Auto-save, restore, and clear-on-submit all work. User Story 1 is fully testable independently.

---

## Phase 4: User Story 2 — Leave Editor Without Losing Progress (Priority: P1)

**Goal**: Surface the active draft as a dot badge on the Routines tab icon and an "In Progress" indicator on the relevant routine card. No navigation is blocked.

**Independent Test**: Start a routine workout, enter a value, switch to the Log tab — verify the Routines tab icon shows a dot badge. Switch back to Routines — verify the in-progress routine card has an "In Progress" indicator. Tap it — verify the form reopens with entered values (relies on Phase 3).

- [X] T011 [P] [US2] Extend `useRoutines` to call `getDraft()` on mount and expose `draftRoutineId: null | number` in its return value in `src/routes/routines/RoutineList/hooks/useRoutines.ts`
- [X] T012 [P] [US2] Add `isInProgress?: boolean` prop to `RoutineCard`; when true render a MUI `Chip` (label "In Progress", size "small") alongside the routine name in `src/routes/routines/RoutineCard.tsx`
- [X] T013 [US2] Pass `draftRoutineId` from `useRoutines` through `RoutineListView` props and supply `isInProgress={routine.id === draftRoutineId}` to each `RoutineCard` in `src/routes/routines/RoutineList/views/RoutineListView.tsx` (depends on T011, T012)
- [X] T014 [P] [US2] Add `useDraftBadge` logic in `AppLayout` (call `getDraft()` on mount and on `location.pathname` change via `useEffect`); wrap `PlaylistPlayIcon` in `<Badge color="error" variant="dot" invisible={!hasDraft}>` for the Routines `BottomNavigationAction` in `src/AppLayout.tsx`

**Checkpoint**: Dot badge on tab and "In Progress" chip on card both appear and disappear correctly as the draft is created and cleared.

---

## Phase 5: User Story 3 — Discard an In-Progress Draft (Priority: P2)

**Goal**: Let the user explicitly abandon their in-progress session with a two-tap confirm flow from inside the workout form.

**Independent Test**: Start a routine workout, enter values, tap "Discard", confirm — verify the form closes, the user lands on the Routines list, the "In Progress" chip is gone, and the tab badge is gone.

- [X] T015 [P] [US3] Add `discardDraft: () => Promise<void>` to `useRoutineWorkout` — calls `clearDraft()` and returns in `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`
- [X] T016 [P] [US3] Add `onDiscard: () => void` prop to `RoutineWorkoutView`; render a "Discard" button (outlined, error colour) and a `ConfirmDialog` (reuse existing component) gated by a local `isDiscardOpen` toggle in `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx`
- [X] T017 [US3] Wire `discardDraft` into `RoutineWorkout` container: pass `onDiscard={async () => { await workout.discardDraft(); navigate('/routines'); }}` to `RoutineWorkoutView` in `src/routes/routines/RoutineWorkout/index.tsx` (depends on T015, T016)

**Checkpoint**: All three user stories are independently functional and end-to-end testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T018 [P] Verify `RoutineList/index.tsx` re-calls `getDraft()` on every mount so `draftRoutineId` is always fresh after navigation (no stale badge on return from workout form)
- [X] T019 [P] Run `npm run lint` and `npm run typecheck` — resolve all errors
- [ ] T020 Run manual verification per `specs/011-routine-draft-persistence/quickstart.md` checklist (all 9 steps)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 2 completion — can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 completion — can run in parallel with Phases 3 & 4
- **Phase 6 (Polish)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3 — independently testable after Phase 2
- **US2 (P1)**: No dependency on US1 or US3 — independently testable after Phase 2 (badge appears even if auto-save isn't wired yet; it reads from whatever draft exists in DB)
- **US3 (P2)**: No dependency on US1 or US2 — independently testable after Phase 2 (can hard-insert a draft row to test discard without US1 auto-save)

### Within Each User Story

- T008 before T009 (need default values shape before wiring watch)
- T009 before T010 (save before clear-on-submit)
- T011 and T012 before T013 (both props needed before view wires them)
- T015 and T016 before T017 (hook + view before container wires them)

---

## Parallel Opportunities

### Phase 2 (Foundational)

```
T002 [schema.ts] ──┐
                   ├─► T004 [schema re-export] ─► T006 [drizzle-kit generate]
T003 [types.ts]  ──┤
                   └─► T005 [repository.ts] ──────► T007 [database.ts facade]
```

T002 and T003 start together. T004 and T005 can overlap (different files). T006 needs T002+T004. T007 needs T005.

### Phase 4 (US2)

```
T011 [useRoutines] ──┐
                     ├─► T013 [RoutineListView]
T012 [RoutineCard]  ──┘

T014 [AppLayout]  ← independent, start any time after Phase 2
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — database layer fully wired
3. Complete Phase 3: US1 — auto-save + restore working
4. Complete Phase 4: US2 — badges visible
5. **STOP and VALIDATE**: reload test, in-app navigation test, badge disappears on submit
6. Add Phase 5 (US3 — Discard) as a follow-up increment

### Incremental Delivery

1. Phases 1–2: DB layer → foundation ready
2. Phase 3 (US1): Data is safe across reloads → core user value delivered
3. Phase 4 (US2): User can freely navigate → UX complete
4. Phase 5 (US3): User can abandon session explicitly → correctness complete
5. Phase 6: Polish → production-ready

---

## Notes

- `[P]` tasks operate on distinct files and have no blocking mutual dependencies
- NaN↔null conversion is the responsibility of `useRoutineWorkout`, not the repository (see contracts/database-api.md)
- The `ON DELETE CASCADE` FK handles FR-010 (draft cleanup on routine delete) at the DB level — no application task needed
- Lint + typecheck must pass before commit (enforced by repo stop-hook)
- No test runner — manual verification via quickstart.md is the validation method
