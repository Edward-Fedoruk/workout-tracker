# Feature Specification: Exercise Detail Page

**Feature Branch**: `015-exercise-detail-page`  
**Created**: 2026-06-12  
**Status**: Draft  
**Input**: User description: "I want to improve the exercise list. remove the edit delete buttons from the list view. When clicking on exercise user should goto individual exercise page. On individual exercise page user should be able to have three dots in a corner to delete or modify exercise. User should see the log history table of this exercise - utilize the simplified log component for this history. User should be able to go to the exercise page from the routine when clicking on exercise name"

## Clarifications

### Session 2026-06-12

- Q: When a user deletes an exercise referenced in one or more routines, what should happen? → A: No change to business logic — delete and edit behave exactly as they currently do; only the UI entry point moves to the three-dots menu.
- Q: Should the edit form open as a modal/bottom sheet or navigate to a separate page? → A: Same presentation as current — whatever the existing list uses today is preserved.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate to Exercise Detail Page (Priority: P1)

A user browsing the exercise library taps on an exercise name or card and is taken to a dedicated detail page for that exercise. The list no longer shows inline edit or delete buttons, making the list cleaner and easier to scan.

**Why this priority**: This is the foundational interaction — removing clutter from the list and enabling navigation to the detail page unlocks all other stories. Without it, nothing else functions.

**Independent Test**: Can be fully tested by navigating to the exercise library, tapping any exercise, and verifying the detail page loads with the correct exercise name and information.

**Acceptance Scenarios**:

1. **Given** the exercise library list is displayed, **When** the user taps on any exercise, **Then** the user is navigated to the individual exercise detail page for that exercise.
2. **Given** the exercise library list is displayed, **When** the user views any exercise row, **Then** no inline edit or delete buttons are visible on the list.
3. **Given** the exercise detail page is open, **When** the user taps the back button or navigates back, **Then** the user returns to the exercise library list.

---

### User Story 2 - Manage Exercise via Three-Dots Menu (Priority: P2)

On the individual exercise detail page, the user sees a three-dots (⋮) menu button in a corner. Tapping it reveals options to edit or delete the exercise, replacing the per-row actions removed from the list.

**Why this priority**: Users still need to manage exercises (edit/delete). This story delivers that capability in a less cluttered, contextually appropriate location.

**Independent Test**: Can be fully tested by opening any exercise detail page, tapping the three-dots menu, and verifying edit and delete options appear and function correctly.

**Acceptance Scenarios**:

1. **Given** the exercise detail page is open, **When** the user taps the three-dots menu, **Then** a menu appears with options to edit and delete the exercise.
2. **Given** the three-dots menu is open, **When** the user selects "Edit", **Then** the exercise edit form opens pre-populated with the current exercise data.
3. **Given** the three-dots menu is open, **When** the user selects "Delete", **Then** a confirmation prompt appears before the exercise is removed.
4. **Given** the user confirms deletion, **When** the delete action completes, **Then** the user is returned to the exercise list and the deleted exercise no longer appears.
5. **Given** the user cancels the delete confirmation, **When** the dialog is dismissed, **Then** the exercise remains unchanged and the detail page is still visible.

---

### User Story 3 - View Exercise Log History on Detail Page (Priority: P2)

On the exercise detail page, the user sees a table of their historical log entries for that exercise, using the existing simplified log component. This gives context on past performance without leaving the exercise page.

**Why this priority**: Log history is high-value context for the user — they can review progress while deciding whether to edit the exercise. Shares priority P2 with the three-dots menu since both enrich the detail page.

**Independent Test**: Can be fully tested by opening an exercise that has past log entries and verifying the log history table displays correct sets, reps, and weights in chronological order.

**Acceptance Scenarios**:

1. **Given** the exercise detail page is open and the exercise has past log entries, **When** the page loads, **Then** a log history table is displayed showing previous workout sets for that exercise.
2. **Given** the exercise detail page is open and the exercise has no past log entries, **When** the page loads, **Then** an empty-state message is shown (e.g., "No history yet").
3. **Given** the log history table is displayed, **When** the user views it, **Then** entries are shown in reverse chronological order (most recent first).

---

### User Story 4 - Navigate to Exercise Detail from Routine (Priority: P3)

When viewing a routine and its exercise list, the user can tap an exercise name to navigate to that exercise's detail page, providing the same detail view and history in context of routine management.

**Why this priority**: Enhances routine management workflow, but the detail page itself (P1/P2) must exist first. Lower priority as it is an access shortcut rather than a core capability.

**Independent Test**: Can be fully tested by opening any routine, tapping an exercise name within it, and verifying navigation to the correct exercise detail page.

**Acceptance Scenarios**:

1. **Given** a routine detail page is open with exercises listed, **When** the user taps an exercise name, **Then** the user is navigated to that exercise's detail page.
2. **Given** the exercise detail page was reached from a routine, **When** the user navigates back, **Then** the user returns to the routine page they came from.

---

### Edge Cases

- What happens when an exercise has a very long name on the detail page header?
- Deletion of an exercise that is referenced in one or more routines follows existing behavior (no change to business logic).
- What if the user navigates to a detail page for an exercise that has since been deleted (e.g., deep link or stale navigation state)?
- How does the log history table behave when there are a large number of entries (pagination or scroll)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The exercise library list MUST NOT display inline edit or delete action buttons on individual exercise rows.
- **FR-002**: Each exercise row in the library list MUST be tappable and navigate the user to that exercise's dedicated detail page.
- **FR-003**: The exercise detail page MUST display the exercise name, muscle group, and any other existing exercise attributes.
- **FR-004**: The exercise detail page MUST include a three-dots (⋮) menu button accessible from the page (e.g., top corner).
- **FR-005**: The three-dots menu MUST offer "Edit" and "Delete" actions for the exercise.
- **FR-006**: Selecting "Edit" from the three-dots menu MUST invoke the existing edit behavior in the same presentation it currently uses (same form, same UI presentation, and same logic as previously triggered from the list), pre-populated with the current exercise data.
- **FR-007**: Selecting "Delete" from the three-dots menu MUST invoke the existing delete behavior (same confirmation dialog and data removal logic as previously used on the list).
- **FR-008**: Upon confirmed deletion, the system MUST remove the exercise and navigate the user back to the exercise library list.
- **FR-009**: The exercise detail page MUST display a log history section showing past workout entries for that exercise, using the existing simplified log component.
- **FR-010**: The log history section MUST show entries in reverse chronological order (most recent first).
- **FR-011**: When the exercise has no log history, the detail page MUST display an appropriate empty-state message.
- **FR-012**: Exercise names displayed within a routine's exercise list MUST be tappable and navigate the user to that exercise's detail page.
- **FR-013**: Navigating back from the exercise detail page MUST return the user to the page they came from (library list or routine page).

### Key Entities

- **Exercise**: A named movement with associated muscle group(s) and optional image; the subject of the detail page.
- **Log Entry**: A recorded set from a past workout associated with a specific exercise; displayed in the history table.
- **Routine**: A saved collection of exercises; the secondary entry point to the exercise detail page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can reach the exercise detail page in one tap from both the exercise library and a routine page.
- **SC-002**: The exercise library list is free of per-row action buttons, reducing visible UI controls per row by 100%.
- **SC-003**: All exercise management actions (edit, delete) remain fully accessible via the three-dots menu on the detail page — zero loss of functionality.
- **SC-004**: The log history table loads and displays on the detail page within the same page-load interaction, with no additional user action required.
- **SC-005**: Users can navigate back from the exercise detail page to the originating page (library or routine) without loss of context.

## Assumptions

- The existing simplified log component used in the workout log view can be reused on the exercise detail page with the exercise filter applied; no new log component needs to be built.
- Edit and delete business logic are unchanged — this feature only relocates the entry points from the list to the three-dots menu on the detail page.
- Deleting an exercise that is part of a routine follows existing deletion behavior with no modifications.
- The exercise detail page is a new route that receives the exercise ID as a route parameter.
- The edit form for exercises already exists and only needs to be wired to the new detail page's three-dots menu rather than the inline list button.
- Pagination or infinite scroll for log history is out of scope for this feature; the simplified log component's existing display behavior is used as-is.
- The back-navigation behavior relies on standard router history (go back one step), not a hardcoded destination.
