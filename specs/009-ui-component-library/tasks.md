# Tasks: Shared UI Component Library & URL Routing

**Input**: Design documents from `specs/009-ui-component-library/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅  
**Tests**: None (no test runner configured — Constitution Principle V)

**Organization**: Tasks grouped by user story. US1+US2 (shared UI components) and US3 (routing) are two independent workstreams after Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Install the new dependency; no source files change yet.

- [X] T001 Install `react-router-dom` — run `npm install react-router-dom` and verify `package.json` has the new dependency

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Build `DialogActionButtons` — the 44px-enforcing primitive that both `ConfirmDialog` and `FormDialog` depend on. Must be complete before Phase 3 dialog components are created.

**⚠️ CRITICAL**: Phase 3 dialog components cannot be built until T002 is done.

- [X] T002 Create `src/components/ui/DialogActionButtons.tsx` — cancel + primary button pair; both buttons enforce `minHeight: 44, minWidth: 44`; accepts `cancelLabel?`, `confirmLabel`, `confirmColor?`, `onCancel`, `onConfirm`, `confirmDisabled?` props (see `contracts/ui-components.ts.md`); no inline `sx` for touch targets on call sites
- [X] T003 Create `src/components/ui/index.ts` — export barrel exporting `DialogActionButtons`; will be expanded in Phase 3

**Checkpoint**: `npm run check` passes. `DialogActionButtons` renders with correct touch targets.

---

## Phase 3: User Stories 1 & 2 — Shared Dialog Components & Migration (P1 + P2) 🎯 MVP

**Goal**: Create `ConfirmDialog` and `FormDialog` then migrate all 6 existing dialogs to use them. After this phase, no feature component imports MUI `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` directly.

**Independent Test**: Open every dialog in the app (delete workout, confirm import, add/edit exercise, add/edit muscle group, delete routine). All buttons must be visually identical, touch targets 44px, no inline `sx` for dialog chrome in any feature file.

### Implementation for User Stories 1 & 2

- [X] T004 [US1] Create `src/components/ui/ConfirmDialog.tsx` — controlled dialog for confirm/destructive prompts; implements the `ConfirmDialogProps` interface from `contracts/ui-components.ts.md`; when `onCancel` is `undefined` the cancel button is hidden and `onClose` is a no-op; uses `DialogActionButtons` internally
- [X] T005 [US1] Create `src/components/ui/FormDialog.tsx` — controlled dialog shell; implements `FormDialogProps` from `contracts/ui-components.ts.md`; accepts `children` for form content and `actions` slot for button row; `maxWidth` defaults to `"xs"`, `fullWidth` defaults to `true`
- [X] T006 [US1] Update `src/components/ui/index.ts` to export `ConfirmDialog` and `FormDialog` alongside `DialogActionButtons`

- [X] T007 [P] [US1] Migrate `src/components/DeleteWorkoutDialog.tsx` — replace `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions`/`Button` imports with `ConfirmDialog` from `../ui`; `confirmLabel="Delete"`, `confirmColor="error"`; remove all `sx` props for dialog chrome
- [X] T008 [P] [US1] Migrate `src/components/ConfirmImportDialog.tsx` — replace dialog boilerplate with `ConfirmDialog`; `confirmLabel="Confirm Import"`, `confirmColor="error"`; move the warning content into `children`; remove all `sx` props for dialog chrome
- [X] T009 [P] [US1] Migrate `src/components/MigrationErrorDialog.tsx` — replace dialog boilerplate with `ConfirmDialog`; pass `onCancel={undefined}` (non-dismissible); the "Retry" and "Reset Database" buttons become the `children` content (or pass a custom actions slot); remove `open` hardcoded to `true` and thread it from the parent
- [X] T010 [P] [US1] Migrate inline delete-routine dialog in `src/components/routines/RoutineList.tsx` — extract the inline `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` block and replace with `ConfirmDialog` from `../../components/ui`; `confirmLabel="Delete"`, `confirmColor="error"`
- [X] T011 [P] [US2] Migrate `src/components/exercises/ExerciseForm.tsx` — replace `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` imports with `FormDialog` from `../../components/ui`; move cancel+save buttons into the `actions` prop using `DialogActionButtons`; remove all `sx` props for dialog chrome; form field content becomes `children`
- [X] T012 [P] [US2] Migrate `src/components/exercises/MuscleGroupForm.tsx` — same pattern as T011; move cancel+save buttons into `actions` using `DialogActionButtons`; remove all `sx` props for dialog chrome

- [X] T013 [US1] Verify Phase 3 complete — run `npm run check`; grep confirms 0 direct MUI `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` imports in `src/components/**` (except `src/components/ui/`); all migrated dialogs open and close correctly in dev server

**Checkpoint**: All 6 dialogs migrated. `npm run check` passes. User Stories 1 & 2 complete and independently testable.

---

## Phase 4: User Story 3 — URL-Based Navigation (P1)

**Goal**: Replace the `ActiveView` state machine in `App.tsx` with `react-router-dom` v6. The app gains real browser history, deep linking, and 7 bookmarkable routes.

**Independent Test**: Directly open each of the 7 routes in a fresh browser tab; confirm correct view loads after DB init. Press browser back/forward between views. Open `/workout-tracker/unknown` and confirm redirect to `/log`.

**⚠️ Coordination note**: Tasks T015–T018 form a coordinated set — component prop removal (T015–T017) and App.tsx overhaul (T018) must all be complete before running `npm run check`, because removing props from components while App.tsx still passes them causes type errors.

### Implementation for User Story 3

- [X] T014 [US3] Create `src/router.tsx` — `createBrowserRouter` with `basename: '/workout-tracker'`; define all 7 routes as per `contracts/routing.ts.md`; root element is `<AppLayout />`; catch-all and `/` redirect to `/log`; route elements use components with no props (navigation handled internally after T015–T017)

- [X] T015 [US3] Create `src/AppLayout.tsx` — layout route component (no props); calls `initDatabase()` once on mount; renders full-page loading indicator while DB is not ready; catches `MigrationError` and renders `MigrationErrorDialog` (no `<Outlet />`); once ready renders MUI `<Tabs>` (active value from `useLocation().pathname` via `pathnameToTabValue()`) above `<Outlet />`; tab bar hidden for sub-routes (`/routines/new`, `/routines/:id/edit`, `/routines/:id/start`)

- [X] T016 [P] [US3] Refactor `src/components/routines/RoutineList.tsx` — remove `onAdd`, `onEdit`, `onStart` props and their `Props` type; replace with `useNavigate()` calls: `navigate('/routines/new')`, `navigate('/routines/${id}/edit')`, `navigate('/routines/${id}/start')`

- [X] T017 [P] [US3] Refactor `src/components/routines/RoutineEditor.tsx` — remove `onBack` and `routineId` props; derive `routineId` from `useParams<{ id: string }>().id` (undefined → create mode); after DB load, if `getRoutineById(numericId)` returns `null`, call `navigate('/routines', { replace: true })`; replace `onBack()` call with `navigate('/routines')`

- [X] T018 [P] [US3] Refactor `src/components/routines/RoutineWorkoutForm.tsx` — remove `onBack` and `routineId` props; derive `routineId` from `useParams()`; add not-found redirect to `/routines`; replace back navigation with `navigate('/routines')`; navigate to `/log` after successful workout save

- [X] T019 [US3] Update `src/App.tsx` — remove `ActiveView` type, `activeView` state, `setActiveView` calls, `showTabBar` logic, and `renderContent()` function; wrap `<RouterProvider router={router} />` in `<ThemeProvider theme={muiTheme}>`; move `MigrationErrorDialog` rendering to `AppLayout`; file should be under 30 lines after cleanup

- [X] T020 [US3] Verify Phase 4 complete — run `npm run check`; confirm 0 occurrences of `ActiveView`/`setActiveView`/`activeView` in `src/`; manually test all 7 routes, browser back/forward, and unknown-URL redirect per `quickstart.md` verification steps

**Checkpoint**: URL routing fully functional. `npm run check` passes. User Story 3 independently testable.

---

## Phase 5: User Story 4 — Regression Verification & Polish (P1)

**Goal**: Confirm all existing features work correctly after both workstreams. Fix any regressions.

**Independent Test**: Every feature in the app (add/edit/delete workout, add/edit/delete exercise, add/edit/delete muscle group, add/edit/delete routine, run routine workout, import/export database) works without error.

- [X] T021 [US4] Full regression check — manually exercise every user-facing feature listed in spec.md US4 acceptance scenarios; record any regressions found
- [X] T022 [US4] Fix any regressions found in T021 — address each in the appropriate component
- [X] T023 Final verification — run `npm run build` (not just dev) to confirm production build succeeds; run `npm run preview` and verify routing works under the `/workout-tracker` base in the production build (critical: dev server and preview server may behave differently for the SPA fallback)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (T001)
    └─► Phase 2 (T002–T003)
            └─► Phase 3 (T004–T013)   — Workstream A: UI components
            └─► Phase 4 (T014–T020)   — Workstream B: Routing
                    (can start in parallel with Phase 3 after T001)
                        └─► Phase 5 (T021–T023)
```

### Within Phase 3

- T004, T005 depend on T002 (DialogActionButtons must exist first)
- T006 depends on T004 and T005
- T007–T012 are parallel — different files, all depend only on T004–T006

### Within Phase 4

- T014 depends on T001 (react-router-dom installed)
- T015 depends on T014 (AppLayout references router structure)
- T016, T017, T018 are parallel — different files; no shared state
- T019 depends on T015 + T016 + T017 + T018 (App.tsx overhaul completes the coordinated set)
- T020 is the verification step for T014–T019

### Parallel Opportunities

```bash
# Phase 3 — after T006, launch all 6 dialog migrations in parallel:
T007 DeleteWorkoutDialog   (no dependencies on T008–T012)
T008 ConfirmImportDialog   (no dependencies on T007, T009–T012)
T009 MigrationErrorDialog  (no dependencies on T007, T008, T010–T012)
T010 RoutineList inline    (no dependencies on T007–T009, T011–T012)
T011 ExerciseForm          (no dependencies on T007–T010, T012)
T012 MuscleGroupForm       (no dependencies on T007–T011)

# Phase 4 — after T015, launch component refactors in parallel:
T016 RoutineList navigation refactor
T017 RoutineEditor params + navigation refactor
T018 RoutineWorkoutForm params + navigation refactor
```

---

## Parallel Example: Phase 3 Dialog Migrations

```text
# All 6 of these can run simultaneously (different files):
Task T007: Migrate DeleteWorkoutDialog.tsx → ConfirmDialog
Task T008: Migrate ConfirmImportDialog.tsx → ConfirmDialog
Task T009: Migrate MigrationErrorDialog.tsx → ConfirmDialog
Task T010: Migrate RoutineList.tsx inline dialog → ConfirmDialog
Task T011: Migrate ExerciseForm.tsx → FormDialog
Task T012: Migrate MuscleGroupForm.tsx → FormDialog
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 — Visual Consistency)

1. Complete Phase 1: Install dependency
2. Complete Phase 2: `DialogActionButtons` foundation
3. Complete Phase 3: All 6 dialog migrations
4. **STOP and VALIDATE**: Every dialog looks consistent; `npm run check` passes; app fully functional
5. Deploy if ready (routing can ship separately)

### Incremental Delivery

1. Setup + Foundational → base ready
2. Phase 3 complete → consistent UI, better developer ergonomics (US1 + US2 done) → shippable
3. Phase 4 complete → URL routing, browser history, deep links (US3 done) → shippable
4. Phase 5 → regression verified, production build confirmed → final

---

## Notes

- Tasks T016, T017, T018 touch different files and are parallel, but T019 (App.tsx) MUST wait for all three — removing props from components while App.tsx still passes them causes TypeScript errors
- Run `npm run check` at the end of each workstream phase, not after every individual task
- `basename: '/workout-tracker'` in `src/router.tsx` must match `base` in `vite.config.ts` — if they diverge, routing silently breaks in production
- The `MigrationErrorDialog` always-open behaviour is preserved: `AppLayout` renders it instead of `<Outlet />` when a migration error occurs; no other route components need to handle this case
