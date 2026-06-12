# Tasks: Date Group Rows in Workout Log

**Input**: Design documents from `/specs/014-date-group-rows/`  
**Branch**: `014-date-group-rows`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: No test runner configured (Principle V). Tasks produce manually verifiable increments per the spec's Independent Test criteria.

**Organization**: Tasks grouped by user story. US1 (divider rows) → US2 (remove date column) → US3 (Advanced full-screen view). US1 and US2 share the same `GroupedWorkoutTable` component; US3 adds `AdvancedWorkoutTable`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependency on in-progress tasks)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths included in every description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the utility and file scaffolding that all three user stories depend on.

- [X] T001 Create `src/utils/dateGroup.ts` with exported types `WorkoutDateGroup` and pure functions `formatDateGroupLabel` and `groupWorkoutsByDate` as specified in `specs/014-date-group-rows/data-model.md` — no React imports, no side effects
- [X] T002 [P] Create empty component folder `src/routes/workouts/GroupedWorkoutTable/` with stub `index.tsx` that exports `GroupedWorkoutTable` (renders `null` for now); accepts props `{ groups: WorkoutDateGroup[], onDelete: (id: number) => void, onEdit: (id: number) => void }`
- [X] T003 [P] Create empty component folder `src/routes/workouts/AdvancedWorkoutTable/` with stub `index.tsx` that exports `AdvancedWorkoutTable` (renders `null` for now); accepts props `{ workouts: WorkoutTableRow[], onDelete: (id: number) => void, onEdit: (id: number) => void, onAdd: () => void }`

**Checkpoint**: `npm run typecheck` passes with stubs in place — confirms type contracts are sound before implementation begins.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire `groupWorkoutsByDate` into `useWorkouts` so grouped data is available to both US1 and US2 components. No visual change yet.

- [X] T004 In `src/routes/workouts/hooks/useWorkouts.ts`, import `groupWorkoutsByDate` from `@/utils/dateGroup` and add a derived `groups` value (`useMemo(() => groupWorkoutsByDate(workouts), [workouts])`) to the hook's return object — no UI change, only the data shape widens
- [X] T005 [P] Add `WorkoutViewMode` type and `advancedOpen` boolean toggle to `useWorkouts` return (use existing `useToggle` hook: `const advancedView = useToggle()`) — exposes `advancedView.isOpen`, `advancedView.onOpen`, `advancedView.onClose` to the view

**Checkpoint**: `npm run typecheck` passes; `useWorkouts` now returns `groups` and `advancedView` without breaking existing `WorkoutsView`.

---

## Phase 3: User Story 1 — Date Divider Rows (Priority: P1) 🎯 MVP

**Goal**: The workout log shows full-width date-divider rows separating day groups; no interactive table controls in this view.

**Independent Test**: Load a log with workouts spanning multiple days. Confirm one divider row per distinct date appears in newest-first order with correct relative labels ("Today", "Yesterday", weekday name, or calendar date). Confirm no sort/filter/search controls are visible. Confirm edit/delete actions still work.

- [X] T006 [US1] Implement `formatDateGroupLabel(isoDate, now)` body in `src/utils/dateGroup.ts`: parse `isoDate` as local midnight (`new Date(y, m-1, d)`), compute delta days, return "Today" / "Yesterday" / weekday / calendar date per FR-002 using `Intl`/`toLocaleDateString` for locale (no hardcoded strings)
- [X] T007 [US1] Implement `groupWorkoutsByDate(rows, now)` body in `src/utils/dateGroup.ts`: single linear pass over pre-ordered `WorkoutTableRow[]`, start a new `WorkoutDateGroup` each time `workout_date` changes, call `formatDateGroupLabel` once per group — O(n), returns newest-first groups
- [X] T008 [US1] Implement `GroupedWorkoutTable` in `src/routes/workouts/GroupedWorkoutTable/index.tsx`: MUI `TableContainer` → `Table` → `TableHead` (Exercise, Set1–Set5, Actions columns — no Date column) → `TableBody` that maps `groups` to alternating divider rows (`TableRow` with `colSpan={7}` containing a MUI `Divider` with `Typography` label) and workout rows (exercise name, `formatSetCell` for each set, `WorkoutRowActions` for edit/delete). No sort, filter, search, or toolbar. Mobile-safe: no fixed pixel widths, verify at 320px.
- [X] T009 [US1] Replace the `MaterialReactTable` render in `src/routes/workouts/views/WorkoutsView.tsx` with `<GroupedWorkoutTable groups={groups} onDelete={requestDelete} onEdit={(id) => { openEdit(id).catch(() => undefined); }} />` — remove the `useMaterialReactTable` call and MRT column definitions from this file (they move to `AdvancedWorkoutTable` in US3)
- [X] T010 [US1] Add an "Advanced" `Button` (or `IconButton`) to the toolbar area in `src/routes/workouts/views/WorkoutsView.tsx`, alongside the existing "Add Workout" button, that calls `advancedView.onOpen` — button is rendered by the container, outside `GroupedWorkoutTable`

**Checkpoint (US1 complete)**: `npm run dev` → workout log shows date-divider rows, no MRT chrome. Resize to 320px — no horizontal scroll. Edit and delete still work.

---

## Phase 4: User Story 2 — Remove the Date Column (Priority: P2)

**Goal**: No `workout_date` column or per-row date value appears in `GroupedWorkoutTable`.

**Independent Test**: Inspect the rendered table — no "Date" column header, no date cell on any row. Every workout row still sits under its day's divider, so the day is unambiguous. Open a workout's edit form — the date field is still visible and editable.

- [X] T011 [US2] Confirm `GroupedWorkoutTable` (from T008) renders NO date column header and NO per-row `workout_date` cell. If `workout_date` still appears anywhere in the component, remove it. This is a verification + cleanup task — the column should already be absent from T008, but explicitly confirm and document the check.
- [X] T012 [P] [US2] Verify `WorkoutForm.tsx` still exposes and pre-populates the `workoutDate` field when editing an existing workout — no change needed, just confirm via `npm run dev` that opening an edit form shows the date; add a code comment if the field binding is non-obvious

**Checkpoint (US2 complete)**: `npm run dev` → no date column in grouped table. Edit a workout — date field visible and editable in form. FR-005, FR-006 satisfied.

---

## Phase 5: User Story 3 — Full-Screen Advanced View (Priority: P3)

**Goal**: Tapping the "Advanced" button opens a full-screen MUI Dialog containing a fully-interactive MaterialReactTable (sort, filter, column visibility, date column present).

**Independent Test**: Tap "Advanced" — dialog opens full-screen. MRT toolbar shows sort/filter/column controls. Date is a column. Sort by exercise name — rows reorder. Tap the close button — dialog closes, grouped view is restored underneath. Reopen the log — grouped view is shown (Advanced does not persist open).

- [X] T013 [US3] Implement `AdvancedWorkoutTable` in `src/routes/workouts/AdvancedWorkoutTable/index.tsx`: move the existing `useMaterialReactTable` setup (columns including `workout_date`, `enableRowActions`, `renderRowActions`, `renderTopToolbarCustomActions`) from `WorkoutsView.tsx` into this component — accepts `{ workouts, onDelete, onEdit, onAdd }` props. Enable sorting and filtering (remove any `enableSorting: false` guards). The "Add Workout" button lives in `renderTopToolbarCustomActions`.
- [X] T014 [US3] Wrap `AdvancedWorkoutTable` in a MUI `Dialog` with `fullScreen` prop in `src/routes/workouts/views/WorkoutsView.tsx`: open when `advancedView.isOpen`, close on a visible close/back `IconButton` (`CloseIcon`) that calls `advancedView.onClose`. The Dialog renders `<AdvancedWorkoutTable workouts={workouts} onDelete={requestDelete} onEdit={...} onAdd={openCreate} />` inside it.
- [X] T015 [US3] Move the "Add Workout" button and form/dialog logic entirely into the `AdvancedWorkoutTable` component (or keep it in the container and pass `onAdd`): confirm `WorkoutForm` and `DeleteWorkoutDialog` are accessible from within the full-screen Advanced Dialog — either rendered inside the Dialog or as separate portals. Verify adding/editing/deleting a workout from the Advanced view works end-to-end.
- [X] T016 [P] [US3] Ensure the full-screen Dialog is mobile-safe: verify at 320px viewport width that the MRT table is horizontally scrollable *within* the Dialog (not the whole page), the close button is always reachable, and touch targets are ≥44×44px.

**Checkpoint (US3 complete)**: `npm run dev` → "Advanced" button opens full-screen MRT dialog. All MRT controls work. Closing returns to grouped view. Adding/editing/deleting workouts works from both views.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, empty states, locale verification, lint/typecheck, build validation.

- [X] T017 Handle the empty-log state in `GroupedWorkoutTable`: when `groups` is empty, render the existing empty-state UI (or a simple "No workouts yet" message consistent with the current MRT empty state) — FR-008
- [ ] T018 [P] Verify locale-aware labels: in browser DevTools, override navigator.language to a non-English locale (e.g. `fr-FR`) and confirm weekday/month names in divider rows change accordingly — FR-010. No code change expected; document the manual check result.
- [ ] T019 [P] Verify future-dated entry edge case: add a workout with a date one day in the future via the edit form, reload, and confirm it appears under a calendar-date divider (not "Today"/"Yesterday") — FR-002 edge case
- [X] T020 Run `npm run lint && npm run typecheck` and fix any issues introduced by the feature changes
- [X] T021 Run `npm run build && npm run preview` and confirm the grouped view and Advanced full-screen Dialog work in the production PWA build (service worker active, offline reload shows correct grouped view)

---

## Dependencies

```
T001 → T006 → T007     (dateGroup utils: types → label fn → group fn)
T002 → T008 → T009     (GroupedWorkoutTable: stub → impl → wired in view)
T003 → T013 → T014     (AdvancedWorkoutTable: stub → impl → dialog wrapper)
T004 → T009            (groups in hook → passed to GroupedWorkoutTable)
T005 → T010 → T014     (advancedView toggle → button → dialog open/close)
T008 → T011            (US2 confirms date column absent in US1 component)
T014 → T015            (Dialog wrapper → Add Workout / form wiring inside it)
T009, T014 → T020      (all source changes done → lint + typecheck)
T020 → T021            (clean lint → build + preview)
```

## Parallel Execution Opportunities

| Parallel group | Tasks | Condition |
|---------------|-------|-----------|
| Phase 1 scaffolding | T002, T003 | After T001 (types needed for stubs) |
| Phase 2 hook additions | T004, T005 | Independent hook changes |
| US2 + US3 start | T011, T013 | After T009 (US1 component exists) |
| US3 mobile + add-workout | T015, T016 | After T014 (dialog exists) |
| Polish | T018, T019 | After T017 |

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (T001–T010)**: Delivers the full grouped view with date dividers, stripped of all MRT chrome, with the "Advanced" button present but the dialog not yet functional. This alone satisfies the primary user need (FR-001 through FR-010).

**Increment 2 = + Phase 4 (T011–T012)**: Confirms the date column is cleanly absent and the edit form still exposes it. Low-effort, high-clarity win.

**Increment 3 = + Phase 5 (T013–T016)**: Full Advanced full-screen dialog. Can be deferred until US1+US2 are validated.

**Increment 4 = Phase 6 (T017–T021)**: Edge cases, locale, build validation. Run last before merge.
