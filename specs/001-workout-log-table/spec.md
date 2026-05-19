# Feature Specification: Workout Log Table

**Feature Branch**: `001-workout-log-table`  
**Created**: 2026-05-18  
**Status**: Draft  
**Input**: User description: "The entire app uses metric units (kg). We need to create a table in the UI for keeping track of individual workouts. The table needs to have the following columns: workout date, exercise name. We also want to track weight and number of reps for each individual set (up to 5 reps per set)"

## Clarifications

### Session 2026-05-18

- Q: How should nested sets (up to 5 per exercise) be displayed in the table? → A: Separate columns per set (Set1_weight, Set1_reps, Set2_weight, Set2_reps, etc.)
- Q: Should workouts require at least 1 set before saving? → A: Yes, minimum 1 set required
- Q: Can users log workouts for future dates? → A: No, restrict to past and current dates only
- Q: What is the default table sort order? → A: Most recent workout first (descending by date)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log a New Workout (Priority: P1)

A user completes a workout and wants to record it in the app. They open the workout table, create a new entry for today with their exercise (e.g., "Bench Press"), and log multiple sets with their weight and reps for each.

**Why this priority**: Core feature — users cannot use the app without the ability to record workouts. This is the foundational use case.

**Independent Test**: Can be fully tested by opening the app, adding a new workout entry with exercise name, workout date, and multiple sets with weight/reps, then verifying the data persists in the table.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** user clicks "Add Workout", **Then** a form appears to enter workout date and exercise name
2. **Given** the form is open with date and exercise, **When** user adds a set with weight (kg) and reps, **Then** the set is added to the form
3. **Given** a user has entered up to 5 sets, **When** user clicks "Save", **Then** the workout entry appears in the table with all sets
4. **Given** a user has saved a workout, **When** they close and reopen the app, **Then** the workout data is still visible in the table

---

### User Story 2 - View Workout History (Priority: P2)

A user opens the app and wants to review their past workouts — seeing which exercises they did, when, and what weights/reps they achieved.

**Why this priority**: Critical for tracking progress and deciding workout parameters. Depends on P1 (logging) working first, but adds immediate value once workouts are recorded.

**Independent Test**: Can be fully tested by verifying workouts appear in a table with columns for date, exercise, and set details (weight, reps), sorted in a logical order (e.g., most recent first).

**Acceptance Scenarios**:

1. **Given** the table contains multiple workouts, **When** user views the table, **Then** all workouts are visible with date, exercise name, and all sets listed
2. **Given** the table is open, **When** user looks at any workout, **Then** each set shows weight (kg) and reps clearly
3. **Given** a user has many workouts, **When** they view the table, **Then** workouts are organized in a clear, readable format (e.g., reverse chronological order)

---

### User Story 3 - Edit/Delete a Workout Entry (Priority: P3)

A user realizes they made a mistake when logging a workout or wants to delete an old entry. They need the ability to modify or remove a workout record.

**Why this priority**: Quality-of-life feature. Essential for data correction, but not blocking initial use. Can be added after core logging and viewing works.

**Independent Test**: Can be fully tested by modifying a workout entry (e.g., changing reps or weight in a set), deleting a workout, and verifying the changes persist.

**Acceptance Scenarios**:

1. **Given** a user has logged a workout with incorrect data, **When** they click "Edit" on that entry, **Then** they can modify the exercise, date, or any set details
2. **Given** an edit form is open, **When** user saves changes, **Then** the table immediately reflects the updates
3. **Given** a user wants to remove a workout, **When** they click "Delete", **Then** a confirmation dialog appears and the entry is removed after confirmation

---

### Edge Cases

- What happens if user tries to add more than 5 sets to a single exercise? (System prevents adding a 6th set)
- How does the system handle a workout without any sets? (Requires at least 1 set before saving — user receives validation error if attempting to save with 0 sets)
- What happens if user enters a future workout date? (Validation prevents future dates; only past and current dates are accepted)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a new workout entry with a workout date and exercise name
- **FR-002**: System MUST allow users to add up to 5 sets per exercise, each with weight (kg) and number of reps
- **FR-003**: System MUST display all workout entries in a table format with columns: `workout_date | exercise_name | Set1_weight | Set1_reps | Set2_weight | Set2_reps | Set3_weight | Set3_reps | Set4_weight | Set4_reps | Set5_weight | Set5_reps` (empty columns for unused sets)
- **FR-004**: System MUST persist all workout data to the browser's local database (SQLite-WASM via OPFS) so data survives app reload
- **FR-005**: System MUST allow users to edit a previously logged workout (modify exercise, date, or set details)
- **FR-006**: System MUST allow users to delete a workout entry (with user confirmation)
- **FR-007**: System MUST validate that weight values are positive numbers in kilograms
- **FR-008**: System MUST validate that rep counts are positive integers
- **FR-009**: System MUST validate that workout date is a valid date (date picker recommended)
- **FR-010**: System MUST prevent users from adding more than 5 sets to a single exercise
- **FR-011**: System MUST require at least 1 set with weight and reps before allowing a workout entry to be saved
- **FR-012**: System MUST validate that workout date is not in the future (only past and current dates allowed)

### Key Entities

- **Workout Log Entry**: Represents a single exercise session. Contains a workout date, exercise name, and a collection of up to 5 sets.
  - Attributes: `workout_date` (date), `exercise_name` (string), `sets` (array of Set objects)
  
- **Set**: Represents a single set within an exercise. Contains the weight lifted and the number of repetitions.
  - Attributes: `set_number` (integer, 1-5), `weight` (number in kg), `reps` (integer)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can log a complete workout (exercise name, date, up to 5 sets) in under 2 minutes
- **SC-002**: All logged workout data persists across browser sessions (verified by closing and reopening the app)
- **SC-003**: The workout table displays 20+ historical workouts without performance degradation
- **SC-004**: Users can view their workout history clearly with date, exercise, weight, and reps visible in a single view (no excessive scrolling for set details)
- **SC-005**: 95% of users successfully log a workout on first attempt without help or confusion

## Assumptions

- Users have a modern browser supporting SQLite-WASM and OPFS (per CLAUDE.md project requirements)
- All weights are recorded in kilograms (metric units as stated in the requirement)
- "Set" refers to a group of repetitions, not a set of exercises — each row in the detail view shows one exercise with multiple sets
- Users will only log exercises for their own workouts (no multi-user/sharing scenarios)
- A workout can have anywhere from 1 to 5 sets for a single exercise — if a user does the same exercise multiple times in a session, they record it as separate entries
- Workout dates are restricted to past and current dates only (future dates are rejected by validation)
- Data retention is indefinite — no automatic deletion or archiving of old workouts
- The table displays workouts sorted by date in descending order (most recent first) by default
