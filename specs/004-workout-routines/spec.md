# Feature Specification: Workout Routines

**Feature Branch**: `004-workout-routines`
**Created**: 2026-05-26
**Status**: Draft
**Input**: User description: "Implement a new page for filling out workout templates so that the user can plan multiple routines (one per day of the week). Each routine consists of multiple exercises. Each exercise has a suggested number of sets and reps. User must be able to define all of these for each routine. For each exercise, the user should be able to edit it, delete it or re-order the list of exercises. A routine must have a configurable name. When user starts their workout they should be able to either log each exercise individually (already implemented) or start a new routine. With a routine, they'd have to fill out the form representing their actual reps, sets and weights."

## Clarifications

### Session 2026-05-26

- Q: What navigation pattern should connect the Routines page to the existing workout log? → A: Top-level tab bar — a persistent tab row (e.g. "Log" / "Routines") added to the app header.
- Q: What UX mechanism should be used to reorder exercises within a routine? → A: Up/down arrow buttons per exercise row (no drag-and-drop library required).
- Q: How should the routine-based workout form handle set entry — how many rows, and what are pre-filled? → A: The number of rows equals the suggested sets configured on the routine exercise. Each row's weight and reps fields are pre-filled with placeholder values from the most recent workout log entry for that exercise name (if one exists).
- Q: How should the Routines tab display routines, and is there a cap on the number? → A: Flat scrollable list of routines; no limit on the number of routines.
- Q: Where is the "Start from routine" entry point — Log tab or Routines tab? → A: Each routine in the Routines tab list has its own "Start" button; the existing "Add Workout" flow on the Log tab is unchanged.
- Q: Does the routine-based workout form open as a full page or a modal? → A: Full-page view (new route); the user navigates back to the Routines tab after submitting or cancelling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Manage Routines (Priority: P1)

A user wants to plan their weekly workout schedule ahead of time. They navigate to a dedicated Routines tab (part of a persistent top-level tab bar alongside the existing "Log" tab) where they can create, edit, and delete named routines. Each routine is a template of exercises with suggested sets and reps. Routines are shown as a flat scrollable list with no cap on the number the user can create. Each routine has a user-defined name (e.g., "Monday — Push", "Wednesday — Pull").

**Why this priority**: Routine management is the foundational capability. Without it, no other routine feature (starting a routine workout, reusing a plan) can function.

**Independent Test**: Can be fully tested by opening the Routines tab, creating a new routine named "Test Day", adding two exercises with different sets/reps, saving, and verifying the routine appears in the list with correct details.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user taps the "Routines" tab, **Then** the Routines page is shown and the tab bar remains visible for navigation back to "Log".
2. **Given** the Routines page is open, **When** the user taps "Add Routine", **Then** a form appears where they can enter a routine name and add exercises with suggested sets and reps.
3. **Given** a routine exists, **When** the user opens it, **Then** they can edit its name, add/edit/delete/reorder exercises, and save changes.
4. **Given** a routine exists, **When** the user deletes it, **Then** the routine is removed from the list and can no longer be started.
5. **Given** the Routines tab is open, **When** the user taps "Add Routine", **Then** a new routine can always be created regardless of how many routines already exist.

---

### User Story 2 — Manage Exercises Within a Routine (Priority: P1)

Within a routine, the user builds a list of exercises. For each exercise the user specifies: the exercise name, the suggested number of sets (1–5), and the suggested number of reps per set. The user can reorder exercises using up/down arrow buttons, edit any exercise in-place, and delete individual exercises.

**Why this priority**: Exercise management is co-equal with routine management — a routine without exercises is not usable. Both P1 stories together form the minimum viable "plan a routine" flow.

**Independent Test**: Can be fully tested by adding three exercises to a routine, reordering them, editing the second one's reps, deleting the third, and verifying the saved routine reflects all changes in the correct order.

**Acceptance Scenarios**:

1. **Given** the user is editing a routine, **When** they add an exercise, **Then** a form accepts an exercise name, number of sets (1–5), and reps per set (1–99), and the exercise is appended to the list on save.
2. **Given** multiple exercises exist in a routine, **When** the user reorders them, **Then** the new order is saved and displayed the same way on next open.
3. **Given** an exercise exists, **When** the user edits it, **Then** the updated name, sets, and reps are saved and reflected in the routine.
4. **Given** an exercise exists, **When** the user deletes it, **Then** it is removed from the routine and the remaining exercises retain their relative order.

---

### User Story 3 — Start a Workout from a Routine (Priority: P2)

When the user begins a workout session, they can choose to start from a routine instead of logging exercises individually. Selecting a routine pre-populates a workout form with all the routine's exercises (in order). For each exercise the form shows the suggested sets and reps as reference, and the user fills in the actual weight, reps, and sets they performed. On completion, a workout log entry is created (one log entry per exercise, matching the existing log format).

**Why this priority**: This is the primary payoff for the routine planning feature. Without it, routines are only useful as a reference document. It is P2 because routine management (P1) must exist first, and the existing ad-hoc logging already provides a functional workout log.

**Independent Test**: Can be fully tested by creating a routine with two exercises, starting a workout from that routine, filling in actual weights/reps, submitting, and verifying two workout log entries appear in the log with the correct date, exercise names, and recorded sets.

**Acceptance Scenarios**:

1. **Given** at least one routine exists on the Routines tab, **When** the user taps the "Start" button next to a routine, **Then** the routine-based workout form opens for that routine. The existing Log tab "Add Workout" flow is unaffected.
2. **Given** the user taps "Start" on a routine, **Then** a workout form appears listing each exercise in the routine's order. Each exercise shows a number of input rows equal to its suggested sets; each row's weight and reps fields are pre-filled as placeholders from the most recent log entry for that exercise name (empty if no prior entry exists).
3. **Given** the user completes the form, **When** they submit, **Then** a workout log entry is created for each exercise with the recorded date, exercise name, and actual sets/weights/reps.
4. **Given** the user starts from a routine, **When** they skip an exercise (leave it blank), **Then** no log entry is created for that exercise and the rest are logged normally.

---

### Edge Cases

- What happens when a routine has no exercises and the user tries to start a workout from it? The "Start from routine" option is disabled for empty routines with an explanatory message.
- What happens if the user edits a routine after having used it to log workouts? Existing log entries are unchanged; only future workouts started from the routine reflect the updated exercise list.
- What if the user provides no name for a routine? Saving is blocked until a non-empty routine name is entered.
- What if two routines have the same name? Duplicate names are permitted; the user is responsible for keeping them distinct.
- What if the user closes the "Start from routine" form mid-way without submitting? No log entries are created; the partial form is discarded.
- What if no prior log entry exists for an exercise? Weight and reps placeholders are left empty; the user fills them in manually.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display a persistent top-level tab bar with at minimum a "Log" tab (existing workout log) and a "Routines" tab (new); tapping either tab navigates to that section without losing the other's state.
- **FR-002**: Users MUST be able to create a new routine by providing a name (required, non-empty, ≤100 characters).
- **FR-003**: Users MUST be able to edit the name of an existing routine.
- **FR-004**: Users MUST be able to delete an existing routine; deletion removes it permanently.
- **FR-005**: There is no limit on the number of routines a user can create. The "Add Routine" action is always available.
- **FR-006**: Users MUST be able to add exercises to a routine; each exercise requires a name (non-empty), suggested sets (integer 1–5), and suggested reps per set (integer 1–99).
- **FR-007**: Users MUST be able to edit an existing exercise within a routine (name, sets, reps).
- **FR-008**: Users MUST be able to delete an individual exercise from a routine.
- **FR-009**: Users MUST be able to reorder exercises within a routine using up/down arrow buttons per exercise row; the saved order is preserved. No drag-and-drop interaction is required.
- **FR-010**: Each routine in the Routines tab list MUST display a "Start" button. Tapping it opens the routine-based workout form for that routine. The existing "Add Workout" flow on the Log tab is unchanged.
- **FR-011**: Tapping "Start" on a routine navigates to a dedicated full-page workout form (new route). The form displays all exercises in the routine's saved order, with suggested sets and reps visible as reference. After submitting or cancelling, the user is returned to the Routines tab.
- **FR-012**: For each exercise in a routine-based workout, the form MUST display a number of input rows equal to the exercise's suggested sets. Each row's weight and reps fields MUST be pre-filled as placeholders with values from the most recent workout log entry for that exercise name (if any prior log entry exists). Users can override any pre-filled value.
- **FR-013**: On submission of a routine-based workout, the system MUST create one workout log entry per exercise that was filled in (matching the existing log format).
- **FR-014**: Exercises left blank during a routine-based workout MUST NOT generate log entries.
- **FR-015**: Routine edits MUST NOT retroactively alter existing workout log entries.

### Key Entities

- **Routine**: A named template representing a planned workout session. Has a name (≤100 chars), an ordered list of routine exercises, and a creation/update timestamp. No cap on the total number of routines.
- **Routine Exercise**: An ordered entry within a routine. Has an exercise name, suggested sets (1–5), suggested reps (1–99), and a position/order index.
- **Workout Log Entry**: An existing entity (unchanged). Created when the user completes a routine-based workout for a filled-in exercise. Contains exercise name, date, and actual set details (weight, reps per set).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a complete routine with 5 exercises in under 3 minutes. The Routines tab displays all routines as a flat scrollable list.
- **SC-002**: Users can start a routine-based workout and submit all exercise logs in under 5 minutes for a 5-exercise routine.
- **SC-003**: 100% of routine-based workout submissions produce the correct number of log entries (one per filled-in exercise, none for blank ones).
- **SC-004**: Exercise reordering within a routine is reflected immediately on screen and survives app reload without data loss.
- **SC-005**: All routine data (names, exercises, order) persists across browser sessions without requiring any network connection.
- **SC-006**: Switching between the "Log" and "Routines" tabs takes under 1 second with no visible layout flash.

## Assumptions

- Routines are per-device and per-browser; there is no cross-device sync (consistent with the existing local-first architecture).
- There is no cap on the number of routines. The "one per day of the week" framing in the original description was illustrative; users may create as many routines as they need.
- Suggested sets and reps in a routine are advisory only; the user records actual values when logging a workout.
- The existing workout log format (exercise name, date, sets with weight and reps) is the target output — no changes to the log schema are assumed.
- The "Start" button for a routine lives on the routine's list row in the Routines tab. There is no shared entry point between ad-hoc logging and routine-based logging; they are independent flows.
- Weight unit (kg vs. lb) is not part of this feature's scope; it follows whatever convention the existing log form uses.
- Routine exercise names are free-form text; there is no shared exercise library in this version.
