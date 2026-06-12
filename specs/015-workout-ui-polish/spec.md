# Feature Specification: Workout UI Polish

**Feature Branch**: `015-workout-ui-polish`  
**Created**: 2026-06-12  
**Status**: Draft  

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Compact, Scannable Log Table (Priority: P1)

A user opens the workout log and wants to scan their recent sessions at a glance. The table should be dense and information-rich without wasted space: icons replace wordy headers and exercise names are represented by their images rather than long text strings.

**Why this priority**: The table is the primary screen and its density directly affects how much data fits without scrolling. Everything else in this spec is secondary to this readability improvement.

**Independent Test**: Open the workout log. Verify set columns show numbered icons (green), exercise rows show an exercise image thumbnail instead of a text name, the column width matches the image, set values display as `12×5` (no "kg", no spaces around "×"), set number text is smaller (12px), and horizontal padding in set cells is tighter.

**Acceptance Scenarios**:

1. **Given** the workout log is loaded, **When** the user views the table header row, **Then** set columns show numbered circular icons in the app's green theme colour instead of "Set 1" / "Set 2" text labels.
2. **Given** a workout row is displayed, **When** the user looks at the exercise column, **Then** they see a square exercise image thumbnail; the column is only as wide as the image.
3. **Given** a set cell contains weight and reps, **When** it is rendered, **Then** it displays as `<weight>×<reps>` with no unit suffix and no spaces (e.g. `80×5`), in 12px font, with 10px horizontal cell padding.
4. **Given** a set cell contains only reps (bodyweight), **When** rendered, **Then** it shows `×<reps>` (e.g. `×12`).
5. **Given** a set cell contains only weight, **When** rendered, **Then** it shows `<weight>` with no unit.

---

### User Story 2 — Advanced Button in Table Header (Priority: P2)

A user wants to switch to the advanced data view. The "Advanced" button should live inside the table's action column header so it doesn't occupy a separate row above the table.

**Why this priority**: Removes visual clutter from the page header and co-locates the navigation control with the column it conceptually belongs to.

**Independent Test**: Load the workout log. Verify there is no standalone "Advanced" button above the table. Verify the action column header cell contains an "Advanced" button. Tapping it opens the full-screen advanced view.

**Acceptance Scenarios**:

1. **Given** the workout log is displayed, **When** the user views the page, **Then** there is no separate "Advanced" button above the table.
2. **Given** the table is rendered, **When** the user looks at the rightmost (actions) column header, **Then** it contains an "Advanced" control.
3. **Given** the user taps the Advanced control, **When** the action fires, **Then** the full-screen advanced view opens exactly as before.

---

### User Story 3 — Three-Dot Action Menu (Priority: P2)

Instead of inline Edit and Delete buttons that consume horizontal space on every row, the user taps a single vertical three-dot icon to reveal a context menu with those actions. This pattern applies consistently in both the grouped table and the advanced full-screen view.

**Why this priority**: Inline buttons are visually noisy and waste the limited column width on mobile. A three-dot menu is a well-understood mobile pattern, and consistency across both views reduces cognitive load when switching between them.

**Independent Test**: Load the workout log. Verify each workout row in the grouped table shows only a single icon button (three vertical dots) in the actions cell. Open the advanced view and verify the same. Tapping the icon in either view opens a menu with "Edit" and "Delete" options that perform the correct operations.

**Acceptance Scenarios**:

1. **Given** a workout row is rendered, **When** the user looks at the actions cell, **Then** they see a single vertical three-dot icon button and no inline Edit/Delete buttons.
2. **Given** the user taps the three-dot icon, **When** the menu opens, **Then** it shows "Edit" and "Delete" entries.
3. **Given** the menu is open and the user selects "Edit", **When** the action fires, **Then** the edit form opens for that workout.
4. **Given** the menu is open and the user selects "Delete", **When** the action fires, **Then** the delete confirmation dialog opens for that workout.
5. **Given** the menu is open, **When** the user taps outside it, **Then** the menu closes without any action.

---

### User Story 4 — Advanced View Clean-Up (Priority: P3)

A user in the full-screen advanced view should not see a redundant "Add Workout" button or a "fullscreen" toggle (it is already fullscreen). On iPhone the table content should not be obscured by the notch or home indicator.

**Why this priority**: These are cosmetic removals and a safe-area fix; functional value is lower than the core table improvements above.

**Independent Test**: Open the advanced view. Verify (a) no "Add Workout" button appears in the toolbar, (b) no fullscreen toggle button appears in the table's built-in toolbar, (c) table content starts below the phone's safe area / notch with adequate top padding.

**Acceptance Scenarios**:

1. **Given** the advanced view is open, **When** the user looks at the top toolbar, **Then** there is no "Add Workout" button.
2. **Given** the advanced view is open, **When** the user looks at the table's own toolbar, **Then** there is no fullscreen toggle icon.
3. **Given** the app is running on an iPhone with a notch, **When** the advanced view is opened, **Then** the table content is fully visible below the safe area with comfortable top padding (at least 16px additional padding beyond the AppBar).

---

### User Story 5 — Bottom Drawer for Add/Edit Workout (Priority: P3)

When the user taps "Add Workout" (FAB) or selects "Edit" for a workout, a drawer slides up from the bottom of the screen instead of a centred modal dialog.

**Why this priority**: Bottom drawers feel native on mobile; modals feel out of place when the form is tall. This is an interaction quality improvement without functional change.

**Independent Test**: Tap the FAB. Verify a panel slides up from the bottom edge. Fill and save a workout. Verify it is recorded. Tap Edit on an existing workout. Verify the same drawer opens pre-populated.

**Acceptance Scenarios**:

1. **Given** the user taps the FAB, **When** the drawer opens, **Then** it slides up from the bottom of the screen.
2. **Given** the drawer is open, **When** the user swipes it down or taps the backdrop, **Then** the drawer closes without saving.
3. **Given** the drawer is open with valid data, **When** the user submits, **Then** the workout is saved and the drawer closes.
4. **Given** the user selects "Edit" from the three-dot menu, **When** the drawer opens, **Then** the form is pre-populated with the existing workout data.
5. **Given** the drawer is open, **When** the keyboard appears, **Then** the drawer content scrolls so the focused field remains visible without clipping the form.

---

### Edge Cases

- What happens when an exercise has no image? The exercise column shows a fixed-size placeholder icon of the same dimensions.
- What happens if the three-dot menu is open and the user navigates away? The menu closes gracefully without triggering any action.
- What happens when the add/edit drawer is open and the DB operation fails? An inline error message appears inside the drawer; the drawer stays open.
- What happens on very small screens (320px wide)? Set columns may collapse but must remain tappable; the drawer must not overflow horizontally.
- What happens in the advanced table after removing the "Add Workout" button? The workout FAB on the main screen remains the sole entry point for creating workouts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The grouped workout table MUST render set column headers using numbered circular icons (equivalent to LooksOne–Looks5) coloured in the app's primary green theme colour, replacing plain "Set N" text labels.
- **FR-002**: The advanced workout table MUST render the same numbered circular icons in the same green colour as FR-001 (consistent across both views).
- **FR-003**: The exercise column in the grouped workout table MUST display the exercise's thumbnail image; if no image exists, a fixed-size placeholder is shown in its place.
- **FR-004**: The exercise image column MUST have a fixed width equal to the rendered image size; the column does not expand for text.
- **FR-005**: Set cell values MUST be formatted as `<weight>×<reps>`, `×<reps>` (reps-only), or `<weight>` (weight-only), with no "kg" unit label and no spaces around "×".
- **FR-006**: Set cell text MUST render at 12px font size.
- **FR-007**: Set cells MUST have 10px horizontal padding (left and right), reduced from the previous 12px default.
- **FR-008**: The standalone "Advanced" button above the grouped table MUST be removed; an equivalent control MUST be placed inside the actions column header of the grouped table.
- **FR-009**: Each workout row's actions cell in BOTH the grouped table and the advanced view MUST contain a single vertical three-dot icon button; inline Edit and Delete buttons MUST be removed from row actions in both views.
- **FR-010**: Tapping the three-dot icon MUST open a contextual menu with "Edit" and "Delete" items that trigger the same operations as the previous buttons.
- **FR-011**: The advanced view MUST NOT render an "Add Workout" button in any toolbar.
- **FR-012**: The advanced view table MUST NOT show a fullscreen toggle control (disabled via table configuration, not hidden via CSS).
- **FR-013**: The advanced view MUST apply sufficient top padding so content is not obscured by the device notch or status bar (at minimum: device safe-area inset-top plus 16px extra).
- **FR-014**: The add/edit workout form MUST be presented in a bottom drawer (animates up from the screen bottom) instead of a centred modal dialog.
- **FR-015**: The bottom drawer MUST be dismissible by swiping down or tapping the backdrop without saving any data.
- **FR-016**: The bottom drawer height MUST be content-driven up to a maximum of 90% of the viewport height; when the form content (or keyboard) causes it to exceed that cap, the content area MUST scroll internally.

### Key Entities

- **Exercise Image**: A thumbnail asset associated with an exercise record, used to visually identify the exercise in table rows instead of its text name.
- **Set Cell**: A table cell displaying the combined weight and reps for one set of a workout, formatted compactly without units.
- **Three-Dot Menu**: A contextual action menu anchored to a row, triggered by a vertical ellipsis icon button, revealing Edit and Delete options.
- **Bottom Drawer**: A sheet that animates up from the bottom edge of the viewport to present the workout add/edit form.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The grouped workout table header row contains zero text-only "Set N" labels; all five set columns show icon headers in green.
- **SC-002**: No set cell in either table view contains the substring "kg" or spaces immediately surrounding "×".
- **SC-003**: Every workout row in the grouped table displays an exercise image or placeholder with no text exercise name visible.
- **SC-004**: The advanced view opens with no "Add Workout" button and no fullscreen toggle present in the rendered UI.
- **SC-005**: Opening the add-workout flow causes a panel to animate from the bottom edge of the screen; no centred modal overlay appears.
- **SC-006**: On a 375px-wide viewport (iPhone SE baseline), all table columns remain visible and tappable after the UI changes.
- **SC-007**: The three-dot menu appears on every workout row and successfully triggers Edit and Delete flows for 100% of tested rows.

## Clarifications

### Session 2026-06-12

- Q: What is the height behaviour of the bottom drawer? → A: Content-driven up to 90% viewport height, scrollable internally when content overflows.
- Q: Should the three-dot action menu apply to both the grouped table and the advanced view, or the grouped table only? → A: Both views.

## Assumptions

- Exercise images are already stored and referenced in the exercise entity from the existing `013-exercise-images` feature; this spec does not change how images are stored or fetched.
- The app's primary green theme colour is already defined in the MUI theme; icon colouring uses the existing primary colour token.
- The bottom drawer replaces the centred modal for both "add" and "edit" flows, reusing the existing `WorkoutForm` component without changes to its internals.
- Safe-area inset handling uses CSS environment variables (`env(safe-area-inset-top)`) or the MUI component variant that already accounts for them.
- The three-dot menu replaces the existing `WorkoutRowActions` component; the component is updated in-place (not duplicated).
- The advanced view's built-in fullscreen toggle is disabled via the MaterialReactTable table configuration option, not via CSS visibility.
- No new database queries or schema changes are required by this feature.
