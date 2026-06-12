# Tasks: Exercise Names in Tables

**Input**: Design documents from `specs/016-exercise-names-tables/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: None — no test runner configured (Constitution Principle V).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4 map to spec.md stories)
- Exact file paths in every description

---

## Phase 1: Setup

No project-level setup required — this feature adds to an existing app with all infrastructure already in place. Proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB layer support for the `exercise_names_in_tables` preference. All user story phases depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Add `getExerciseNamesInTables()` and `setExerciseNamesInTables(enabled: boolean)` methods to `AppSettingRepository` in `src/db/entities/app-setting/repository.ts`
- [ ] T002 Export `getExerciseNamesInTables` and `setExerciseNamesInTables` as named exports from `src/database.ts`

**Checkpoint**: DB helpers available — user story phases can now begin.

---

## Phase 3: User Stories 1, 3 & 4 — Toggle in Workout Log (Priority: P1/P2/P3) 🎯 MVP

**Goal**: Settings toggle that swaps the Workout Log table first column between avatar and name; preference persists across sessions and can be reversed.

**Independent Test**: Open Settings → enable "Exercise Names in Tables" → Workout Log shows names (~120px column, ellipsis on overflow); reload app → still on; disable toggle → avatars return.

- [ ] T003 [P] [US1] Update `GroupedWorkoutTable` to accept `firstColumn: 'avatar' | 'name' | 'none'` prop and render: avatar cell (64px) for `'avatar'`, name text cell (120px, ellipsis) for `'name'`, no first column for `'none'` — in `src/routes/workouts/GroupedWorkoutTable/index.tsx`
- [ ] T004 [P] [US1] Create `useDisplaySettings` hook with `exerciseNamesInTables: boolean`, `isLoading: boolean`, and `toggle: () => Promise<void>` in `src/routes/settings/hooks/useDisplaySettings.ts`
- [ ] T005 [P] [US1] Update `useWorkouts` hook: load `getExerciseNamesInTables()` in `refresh()`; add `exerciseNamesInTables: boolean` to return type in `src/routes/workouts/hooks/useWorkouts.ts`
- [ ] T006 [US1] Update `WorkoutsView` to pass `firstColumn={exerciseNamesInTables ? 'name' : 'avatar'}` to `GroupedWorkoutTable` in `src/routes/workouts/views/WorkoutsView.tsx`
- [ ] T007 [US1] Add "Display" section with `FormControlLabel`+`Switch` for "Exercise Names in Tables" to `SettingsView`, above the existing "Data" section in `src/routes/settings/views/SettingsView.tsx`
- [ ] T008 [US1] Wire `useDisplaySettings` in `Settings` container: call `refresh` on mount, pass `displaySettings` to `SettingsView` in `src/routes/settings/index.tsx`

**Checkpoint**: User Stories 1, 3, and 4 fully functional. Toggle works, persists, and is reversible.

---

## Phase 4: User Story 2 — Exercise Detail Page No Identity Column (Priority: P1)

**Goal**: The log table on the Individual Exercise page has no first column at all — neither avatar nor name.

**Independent Test**: Navigate to any exercise detail page → the log table begins directly with the set columns; no avatar, no name column — regardless of toggle state.

- [ ] T009 [US2] Change `firstColumn` prop on `GroupedWorkoutTable` in `ExerciseDetailView` from `showExerciseNames={true}` (or current avatar rendering) to `firstColumn="none"` in `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx`

**Checkpoint**: User Story 2 complete and independently verifiable.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T010 [P] Run `npm run typecheck` and resolve any TypeScript errors across all changed files
- [ ] T011 [P] Run `npm run lint` and resolve any lint warnings across all changed files
- [ ] T012 Walk through the quickstart.md verification checklist manually in the running app (`npm run dev`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. Blocks all user story phases.
- **Phase 3 (US1/US3/US4)**: Requires Phase 2 complete (T001, T002).
- **Phase 4 (US2)**: Requires T003 only (the `GroupedWorkoutTable` prop change).
- **Polish (Phase 5)**: Requires all prior phases complete.

### Within Phase 3

```
T001 → T002 → T003 [P]
                T004 [P]  ← these three can start in parallel after T002
                T005 [P]

T003 + T005 → T006
T004        → T007
T004 + T007 → T008
```

### Within Phase 4

- T009 requires only T003 (GroupedWorkoutTable prop type must exist first).
- Phase 4 can therefore start as soon as T003 is complete — it does not need T004–T008.

---

## Parallel Opportunities

### Phase 3 parallel batch (after T002)

```
Task: T003 — GroupedWorkoutTable prop update  (src/routes/workouts/GroupedWorkoutTable/index.tsx)
Task: T004 — useDisplaySettings hook          (src/routes/settings/hooks/useDisplaySettings.ts)
Task: T005 — useWorkouts update               (src/routes/workouts/hooks/useWorkouts.ts)
```

### Polish parallel batch (Phase 5)

```
Task: T010 — typecheck
Task: T011 — lint
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2)

1. Phase 2: T001 → T002
2. Phase 3: T003, T004, T005 (parallel) → T006, T007, T008
3. Phase 4: T009
4. **STOP and VALIDATE** against quickstart.md checklist
5. Polish: T010, T011, T012

### Incremental Order

All stories share the same DB layer (Phase 2) and table component (T003). The natural order is:

1. Foundation (T001–T002) → enables everything
2. Table component (T003) → enables both Workout Log wiring and Exercise Detail fix
3. Settings hook + Workout Log wiring (T004–T008) → completes US1/US3/US4
4. Exercise Detail fix (T009) → completes US2
5. Polish (T010–T012)

---

## Notes

- No migration file needed — `app_setting` table already exists in every user's DB.
- T009 is the smallest task in the list (~1 line change): just change the `GroupedWorkoutTable` prop in `ExerciseDetailView`.
- `firstColumn` is a **required** prop — TypeScript will surface every call-site that needs updating.
- `useDisplaySettings.toggle()` follows the same fire-and-forget pattern as `useBodyWeight.handleSave`.
