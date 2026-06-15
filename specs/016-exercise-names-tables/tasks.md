# Tasks: Exercise Names in Tables

**Input**: Design documents from `specs/016-exercise-names-tables/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: None — no test runner configured (Constitution Principle V).

**Organization**: Tasks grouped by user story for independent implementation and testing. US1/US3/US4 share an implementation path (same toggle mechanism); US2 is independent and can start as soon as T003 is done.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4 map to spec.md stories)
- Exact file paths in every description

---

## Phase 1: Setup

No project-level setup required — this feature adds to an existing app with all infrastructure in place. Proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB layer support for the `exercise_names_in_tables` preference. All user story phases depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add `getExerciseNamesInTables(): Promise<boolean>` and `setExerciseNamesInTables(enabled: boolean): Promise<void>` to `AppSettingRepository` in `src/db/entities/app-setting/repository.ts` — absent row returns `false`; writes `"true"` / `"false"` via Drizzle upsert (`onConflictDoUpdate`)
- [x] T002 Export `getExerciseNamesInTables` and `setExerciseNamesInTables` as named exports from `src/database.ts` (follow the `getBodyWeight` / `setBodyWeight` pattern immediately above the existing Settings operations block)

**Checkpoint**: DB helpers available — user story phases can now begin.

---

## Phase 3: User Stories 1, 3 & 4 — Toggle in Workout Log (Priority: P1/P2/P3) 🎯 MVP

**Goal**: Settings toggle that swaps the Workout Log table first column between avatar (64px) and exercise name (120px, CSS-truncated). Preference persists across sessions (US3) and is reversible (US4) — both emerge naturally from the same SQLite-backed implementation.

**Independent Test**: Open Settings → enable "Exercise Names in Tables" → navigate to Workout Log — table shows names in ~120px column with ellipsis on long names. Reload app → still on. Navigate back to Settings → disable → navigate to Workout Log — avatars returned.

### Implementation

- [x] T003 [P] [US1] Add `firstColumn: 'avatar' | 'name' | 'none'` required prop to `GroupedWorkoutTable` in `src/routes/workouts/GroupedWorkoutTable/index.tsx` — render: 64px Avatar cell for `'avatar'`; 120px Typography cell with `noWrap`/`textOverflow: 'ellipsis'`/`overflow: 'hidden'` for `'name'`; no first column (skip header cell and body cell) for `'none'`; update `TOTAL_COLUMNS` to `identityColumnCount + SET_NUMBERS.length` where `identityColumnCount` is `0` when `'none'`, `1` otherwise
- [x] T004 [P] [US1] Create `useDisplaySettings` hook in `src/routes/settings/hooks/useDisplaySettings.ts` — shape: `{ exerciseNamesInTables: boolean; isLoading: boolean; toggle: () => Promise<void>; refresh: () => Promise<void> }` — `toggle()` calls `setExerciseNamesInTables(!current)` then updates local state; `isLoading` starts `true`, set to `false` after first `getExerciseNamesInTables()` resolves
- [x] T005 [P] [US1] Update `useWorkouts` hook in `src/routes/workouts/hooks/useWorkouts.ts` — add `getExerciseNamesInTables()` to the `Promise.all` in `refresh()`; store result as `exerciseNamesInTables: boolean` state (default `false`); include in return type
- [x] T006 [US1] Update `WorkoutsView` in `src/routes/workouts/views/WorkoutsView.tsx` — add `exerciseNamesInTables: boolean` to `WorkoutsViewProps`; pass `firstColumn={exerciseNamesInTables ? 'name' : 'avatar'}` to `GroupedWorkoutTable` (depends on T003, T005)
- [x] T007 [US1] Add "Display" section to `SettingsView` in `src/routes/settings/views/SettingsView.tsx` — insert above the existing "Data" section: `<Typography variant="subtitle1">Display</Typography>` + `<FormControlLabel control={<Switch checked={...} disabled={isLoading} onChange={() => { toggle().catch(() => undefined); }} />} label="Exercise Names in Tables" />` + `<Divider />`; add `displaySettings: UseDisplaySettingsReturn` to `SettingsViewProps` (depends on T004)
- [x] T008 [US1] Wire `useDisplaySettings` in the `Settings` container `src/routes/settings/index.tsx` — call `const displaySettings = useDisplaySettings();` alongside existing hooks; add `displaySettings.refresh().catch(() => undefined)` to the `useEffect` (or a separate `useEffect`); pass `displaySettings` to `<SettingsView />` (depends on T004, T007)

**Checkpoint**: User Stories 1, 3, and 4 fully functional. Toggle works, persists across reloads, and is reversible.

---

## Phase 4: User Story 2 — Exercise Detail Page No Identity Column (Priority: P1)

**Goal**: The log table on the Individual Exercise detail page shows no first column at all — neither avatar nor name — regardless of toggle state.

**Independent Test**: Navigate to any exercise → the log table begins directly with the set icon columns; no avatar, no name; no change observed when toggling "Exercise Names in Tables" in Settings.

### Implementation

- [x] T009 [US2] In `ExerciseDetailView` (`src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx`), pass `firstColumn="none"` to `<GroupedWorkoutTable>` (the instance inside the `{groups.length === 0 ? ... : <GroupedWorkoutTable ... />}` branch); no other changes needed (depends on T003)

**Checkpoint**: User Story 2 complete. Exercise Detail page shows set columns with no identity column, regardless of toggle state.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T010 [P] Run `npm run typecheck` and resolve any TypeScript errors across all changed files — pay particular attention to `firstColumn` prop being required (all call-sites must be updated)
- [x] T011 [P] Run `npm run lint` and resolve any lint warnings across all changed files
- [ ] T012 Walk through the quickstart.md verification checklist manually in the running app (`npm run dev`) — confirm all items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. Blocks all user story phases.
- **Phase 3 (US1/US3/US4)**: Requires Phase 2 complete (T001, T002).
- **Phase 4 (US2)**: Requires T003 only — can start as soon as T003 is done, does not need T004–T008.
- **Polish (Phase 5)**: Requires all prior phases complete.

### Within Phase 3

```
T001 → T002 → T003 [P]
               T004 [P]   ← these three start in parallel after T002
               T005 [P]

T003 + T005 → T006
T004        → T007
T004 + T007 → T008
```

### Within Phase 4

- T009 requires only T003 (the `firstColumn` prop type must exist first).
- Phase 4 can therefore start as soon as T003 is done — parallel to T004/T005.

---

## Parallel Opportunities

### Phase 3 parallel batch (after T002)

```
Task: T003 — GroupedWorkoutTable prop update          src/routes/workouts/GroupedWorkoutTable/index.tsx
Task: T004 — useDisplaySettings hook (new)            src/routes/settings/hooks/useDisplaySettings.ts
Task: T005 — useWorkouts hook update                  src/routes/workouts/hooks/useWorkouts.ts
```

### Phase 4 can overlap with Phase 3

- T009 only depends on T003, so it can run in parallel with T004/T005/T006/T007/T008.

### Polish parallel batch (Phase 5)

```
Task: T010 — typecheck
Task: T011 — lint
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 — both P1)

1. Phase 2: T001 → T002
2. Phase 3: T003, T004, T005 (parallel) → T006, T007, T008
3. Phase 4: T009 (can overlap with Phase 3 after T003)
4. **STOP and VALIDATE** against quickstart.md checklist
5. Polish: T010, T011, T012

### Incremental Order (one task at a time)

All stories share the same DB layer (Phase 2) and table component (T003). Natural order:

1. T001 → T002 (Foundation — enables everything)
2. T003 (Table component — enables both Workout Log wiring and Exercise Detail fix)
3. T004, T005 (parallel — hooks for Settings and Workouts)
4. T006 → T007 → T008 (Workout Log wiring and Settings UI)
5. T009 (Exercise Detail fix — minimal, ~1 line change)
6. T010, T011, T012 (Polish)

---

## Notes

- No migration file needed — `app_setting` table already exists in every user's DB. T001 adds a new data key, not a schema change.
- `firstColumn` is a **required** prop — TypeScript will surface every call-site at typecheck time (T010).
- T009 is the smallest task: one prop addition to an existing `<GroupedWorkoutTable>` call.
- US3 (persistence) and US4 (reversibility) require no extra tasks — they are natural properties of the SQLite-backed `toggle()` implementation from T004.
- `useDisplaySettings.toggle()` follows the same fire-and-forget pattern as `useBodyWeight.handleSave` — no user-visible error state.
- The Workout Log shows images by default while loading (T005's `isLoading` guard already hides the table behind a `<CircularProgress>`); no extra flash guard needed.
