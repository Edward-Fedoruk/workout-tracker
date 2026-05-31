# Feature Specification: Shared UI Component Library & URL Routing

**Feature Branch**: `009-ui-component-library`  
**Created**: 2026-05-31  
**Status**: Draft  
**Input**: User description: "Refactor react components by extracting shared UI elements (dialogs, inputs, forms, buttons, etc) into dumb controlled reusable UI components. Make them handle most of the UI styling."

## Clarifications

### Session 2026-05-31

- Q: Should react-router replace the current state-based routing as a scope addition to this feature, or be a separate spec? → A: Expand this spec — add react-router alongside the UI component library in the same feature.
- Q: What URL scheme should sub-views use? → A: Nested under `/routines`: `/log`, `/routines`, `/routines/new`, `/routines/:id/edit`, `/routines/:id/start`, `/exercises`, `/settings`.
- Q: When the DB is not ready and the user navigates to a deep link, what should happen? → A: Global loading gate — all routes show a loading screen until DB is ready, then render the target route.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Visual UI Across the App (Priority: P1)

As a user of the app, all dialogs, buttons, and form inputs look and behave consistently — same sizing, spacing, touch targets, and color conventions — regardless of which feature they come from.

**Why this priority**: Visual inconsistency is immediately noticeable to users; consolidating styles into shared components is the prerequisite for everything else in this feature.

**Independent Test**: Can be validated by opening each dialog in the app (add exercise, delete workout, import database, add muscle group, edit exercise) and confirming that buttons, spacing, and input sizing are visually identical across all of them.

**Acceptance Scenarios**:

1. **Given** the user opens the "Add Exercise" dialog, **When** they compare it to the "Delete Workout" dialog, **Then** Cancel and primary action buttons have identical sizing and padding.
2. **Given** any dialog in the app is open, **When** the user observes the action buttons, **Then** all buttons meet minimum touch-target size (44×44px) consistently.
3. **Given** any text input with a validation error is shown, **When** the user looks at the error styling, **Then** error display (color, position, typography) is identical regardless of which form it appears in.

---

### User Story 2 - Developer Can Build New Dialogs Without Duplicating Styles (Priority: P2)

As a developer adding a new feature with a dialog or confirmation prompt, the shared components handle layout and styling, so the new feature only specifies content and behavior — no copy-pasting of `sx` props or MUI wrapper boilerplate.

**Why this priority**: The app will grow with more dialogs and forms; without shared primitives, every new feature repeats the same structural boilerplate and diverges over time.

**Independent Test**: Can be validated by adding a new confirmation dialog for any future feature using only the shared components, with zero inline `sx` styling for structure or touch-target sizing.

**Acceptance Scenarios**:

1. **Given** a developer creates a new confirmation dialog using the shared `ConfirmDialog` component, **When** they inspect the resulting component, **Then** it contains no inline `sx` props for dialog structure, button sizing, or spacing.
2. **Given** a developer creates a new form dialog, **When** they use the shared `FormDialog` component, **Then** the dialog layout (title, scrollable content area, action row) is provided automatically without manual assembly.
3. **Given** a developer needs a cancel + primary action button pair, **When** they use the shared button component, **Then** touch targets, label conventions, and color semantics are applied without explicit `sx`.

---

### User Story 3 - URL-Based Navigation with Browser History (Priority: P1)

As a user, I can use the browser's back and forward buttons to navigate between sections of the app, and I can bookmark or share a direct link to any top-level view or sub-view.

**Why this priority**: The current state-based routing loses navigation position on reload and prevents deep linking; URL-based routing is a fundamental usability improvement.

**Independent Test**: Can be validated by navigating to `/routines/123/edit`, copying the URL, opening a new tab with that URL, and confirming the edit view loads correctly after the DB initialises.

**Acceptance Scenarios**:

1. **Given** the user is editing a routine at `/routines/123/edit`, **When** they press the browser back button, **Then** they return to `/routines`.
2. **Given** the user bookmarks `/exercises` and later opens it directly, **When** the DB finishes loading, **Then** the Exercises view is shown (not the default Log view).
3. **Given** the user navigates Log → Routines → Edit Routine, **When** they press back twice, **Then** they arrive back at Log via browser history.
4. **Given** the user is on `/routines/new` and the DB is still loading, **When** the DB becomes ready, **Then** the new-routine form renders without redirecting to another route.

---

### User Story 4 - Existing Features Are Unaffected by the Refactor (Priority: P1)

As a user, all existing functionality — adding/editing exercises, logging workouts, managing muscle groups, importing/exporting data, deleting workouts, running routines — continues to work exactly as before after the refactor.

**Why this priority**: A pure refactor must have zero user-facing behavioral impact; any regression is a failure of the refactor, not an acceptable trade-off.

**Independent Test**: Can be validated by exercising every feature that uses a dialog, form, or navigation before and after the refactor and confirming no behavioral difference.

**Acceptance Scenarios**:

1. **Given** the refactor is complete, **When** the user adds a workout with multiple sets, **Then** the form validates and saves identically to before.
2. **Given** the refactor is complete, **When** the user triggers the delete workout confirmation, **Then** canceling keeps the workout and confirming removes it.
3. **Given** the refactor is complete, **When** the user adds or edits an exercise or muscle group, **Then** validation, error display, and save behavior are unchanged.
4. **Given** the refactor is complete, **When** the user starts a routine workout and completes it, **Then** the workout is saved and the user returns to the routines list.

---

### Edge Cases

- What happens when a shared dialog component receives no action buttons? It should render without crashing with a sensible empty state.
- How does the confirm dialog handle a destructive action with a custom color vs. a neutral one — does the API support both without needing custom `sx`?
- What happens when a shared form dialog's content is taller than the viewport — does scrolling still work?
- How does the component library handle the `MigrationErrorDialog` which is always-open and non-dismissible — does the shared dialog component support an optional `onClose` prop?
- What happens when the user navigates to an unknown URL (e.g. `/foo`)? The app should redirect to `/log`.
- What happens when the user navigates to `/routines/:id/edit` with a non-existent routine ID? The app should navigate back to `/routines`.

## Requirements *(mandatory)*

### Functional Requirements

**UI Component Library**

- **FR-001**: The codebase MUST contain a shared `ConfirmDialog` component that renders a title, body message, a cancel action, and a primary action with configurable label and color (default, error, warning, etc.).
- **FR-002**: The codebase MUST contain a shared `FormDialog` component that renders a title, a scrollable content area for form fields, and an action row — accepting content and actions as props.
- **FR-003**: The codebase MUST contain shared button primitive(s) that enforce the 44×44px minimum touch target and follow the cancel/primary-action labeling conventions already used in the app.
- **FR-004**: All three existing confirmation dialogs (`ConfirmImportDialog`, `DeleteWorkoutDialog`, `MigrationErrorDialog`) MUST be migrated to use the shared `ConfirmDialog` (or `FormDialog`) component.
- **FR-005**: Both existing form dialogs (`ExerciseForm`, `MuscleGroupForm`) MUST be migrated to use the shared `FormDialog` component.
- **FR-006**: Shared components MUST be purely presentational (dumb/controlled) — they hold no state, make no DB calls, and contain no business logic.
- **FR-007**: Shared components MUST live in a dedicated `src/components/ui/` directory, separate from feature-specific components.
- **FR-008**: After migration, no existing feature component MUST import MUI `Dialog`, `DialogTitle`, `DialogContent`, or `DialogActions` directly — all dialog structure MUST come from the shared components.
- **FR-009**: Inline `sx` props for dialog structure, button touch targets, content spacing, and action-row layout MUST be removed from feature components and absorbed into the shared components.
- **FR-010**: All shared components MUST be fully controlled — open/close state, values, and callbacks are always passed as props from the parent.

**URL Routing**

- **FR-011**: The app MUST use URL-based routing with the following route definitions: `/log`, `/routines`, `/routines/new`, `/routines/:id/edit`, `/routines/:id/start`, `/exercises`, `/settings`.
- **FR-012**: Navigating to an unknown URL MUST redirect the user to `/log`.
- **FR-013**: Navigating to `/routines/:id/edit` or `/routines/:id/start` with a non-existent routine ID MUST redirect the user to `/routines`.
- **FR-014**: The browser back and forward buttons MUST navigate between previously visited routes in the app.
- **FR-015**: All routes MUST respect a global DB-ready gate — if the DB has not yet finished loading, every route shows a loading indicator and then renders the intended route once the DB is ready (no redirect to a default route).
- **FR-016**: The MUI tab bar (Log, Routines, Exercises, Settings) MUST remain as the primary navigation UI, with its active state driven by the current URL rather than component state.
- **FR-017**: The `ActiveView` state union in `App.tsx` MUST be removed and replaced by URL-driven routing.

### Key Entities

- **ConfirmDialog**: A reusable dialog for destructive or confirmatory prompts. Props: `open`, `title`, `message` (or children), `cancelLabel`, `confirmLabel`, `confirmColor`, `onCancel`, `onConfirm`. Optionally `onClose` for always-open variants.
- **FormDialog**: A reusable dialog shell for form content. Props: `open`, `title`, `onClose`, `actions` (render prop or slot for the action row), `children` (form content), optionally `maxWidth`/`fullWidth`.
- **DialogActions slot (cancel + primary)**: Reusable cancel and primary action buttons that handle sizing and color — configured via props, not inline styles.
- **Route structure**: Top-level routes (`/log`, `/routines`, `/exercises`, `/settings`) map to tab views. Sub-routes (`/routines/new`, `/routines/:id/edit`, `/routines/:id/start`) are nested under `/routines` and hide the tab bar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 existing dialogs in the app use the shared components — 0 direct MUI `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` imports remain in feature-level components.
- **SC-002**: Inline `sx` props for dialog chrome (structure, action-row, touch-target sizing) are reduced to 0 across all migrated components.
- **SC-003**: The visual appearance of every dialog and form in the app is pixel-equivalent before and after the refactor (verified by manual comparison).
- **SC-004**: All existing features (add/edit exercise, add/edit muscle group, log workout, delete workout, import/export, run routine) work without regressions after migration.
- **SC-005**: A new confirmation dialog can be added to the app with fewer than 10 lines of component code using only shared primitives.
- **SC-006**: The `ActiveView` state union is fully removed from `App.tsx` — 0 occurrences of `setActiveView` or `activeView` remain.
- **SC-007**: Navigating directly to each of the 7 defined routes in a fresh browser tab renders the correct view after DB initialization.
- **SC-008**: Browser back/forward navigation between all top-level tabs and at least one sub-route (`/routines/:id/edit`) works correctly.

## Assumptions

- The app uses MUI as its component library; shared components will be thin, styled wrappers over MUI primitives, not replacements for them.
- The refactor is limited to dialog/form chrome — data-display components (`WorkoutTable`, `WorkoutSetRow`, `WorkoutSetInputRow`, etc.) are out of scope for this iteration.
- The `WorkoutForm` component (which renders inline, not in a dialog) is out of scope for the `FormDialog` extraction but may benefit from shared button primitives.
- No new UI patterns are introduced — the shared components capture only what already exists across the current dialogs.
- TypeScript typing of all shared components is required; no `any` props.
- The shared component library is internal to this project — no packaging or publication is needed.
- React Router v6 (or later) is assumed; the `createBrowserRouter` / `RouterProvider` pattern is preferred over the legacy `<BrowserRouter>` wrapper.
- The PWA service worker's offline caching strategy does not need to change — all routes are served from the same `index.html` entry point (SPA mode). The server/Vite config already handles this.
- The tab bar shows for top-level routes only; sub-routes (`/routines/new`, `/routines/:id/edit`, `/routines/:id/start`) hide the tab bar, matching current behaviour.
