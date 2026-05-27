# Feature Specification: Custom Exercise Library

**Feature Branch**: `005-custom-exercises`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "Implement a way for the user to create custom exercises so that they could pick one from a dropdown when they define a routine or log an individual workout."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick Exercise from Dropdown (Priority: P1)

When defining a routine or logging a workout, the user selects an exercise from a searchable dropdown list. The list is pre-populated with a standard set of exercises on first launch.

**Why this priority**: This is the core value of the feature — without a populated exercise list, neither routine creation nor workout logging can reference exercises by name. Everything else depends on this foundation.

**Independent Test**: Open the routine builder or workout log screen. Tap/click the exercise field. A dropdown appears with the full exercise list. Select any exercise. It is recorded correctly.

**Acceptance Scenarios**:

1. **Given** the exercise library has been seeded, **When** the user opens the exercise picker in the routine builder, **Then** all exercises appear in alphabetical order in a searchable dropdown.
2. **Given** the exercise library has been seeded, **When** the user opens the exercise picker while logging a workout, **Then** all exercises appear in alphabetical order in a searchable dropdown.
3. **Given** the dropdown is open, **When** the user types part of an exercise name, **Then** the list filters to matching exercises in real time.
4. **Given** the dropdown is open, **When** the user selects an exercise, **Then** that exercise is assigned to the routine slot or workout set and the dropdown closes.

---

### User Story 2 - Add an Exercise (Priority: P2)

The user creates a new exercise by providing a name and selecting one or more muscle groups. The new exercise is immediately available in the dropdown.

**Why this priority**: Users need to add exercises not in the pre-seeded list to log their workouts accurately.

**Independent Test**: Use the "Add exercise" action in the Exercise Library or picker. Enter a name, select at least one muscle group, and save. The new exercise appears in the dropdown on subsequent opens.

**Acceptance Scenarios**:

1. **Given** the user is adding an exercise, **When** they provide a unique name and select at least one muscle group, **Then** the exercise is saved and immediately selectable.
2. **Given** the user attempts to create an exercise, **When** the name field is empty or contains only whitespace, **Then** the form shows a validation error and does not save.
3. **Given** the user attempts to create an exercise, **When** the name already exists (case-insensitive, trimmed), **Then** the form shows a duplicate-name error and does not save.
4. **Given** the user attempts to create an exercise, **When** no muscle group is selected, **Then** the form shows a validation error and does not save.
5. **Given** an exercise has been created, **When** the user reopens the app, **Then** the exercise is still present in the list with its muscle group assignments.

---

### User Story 3 - Manage Exercises and Muscle Groups (Priority: P3)

The user can create, rename, and delete exercises and muscle groups via the **Exercise Library** screen in the main navigation. Deleting an exercise preserves existing workout log entries. Deleting a muscle group removes it from any exercises that referenced it.

**Why this priority**: Users make mistakes; the ability to correct names or prune unused entries rounds out the feature without blocking the core flow.

**Independent Test**: Open the Exercise Library screen. Rename an exercise, verify the new name appears in the dropdown. Delete an exercise, verify it no longer appears but past log entries are unaffected. Add a new muscle group, verify it is available when editing an exercise. Delete a muscle group, verify it is removed from exercises that referenced it.

**Acceptance Scenarios**:

1. **Given** any exercise exists, **When** the user renames it, **Then** the updated name appears in the dropdown, in any routine that references it, and in existing workout log entries.
2. **Given** any exercise exists, **When** the user deletes it, **Then** it no longer appears in the dropdown; existing workout log entries that referenced it are preserved.
3. **Given** any exercise exists, **When** the user edits its muscle group assignments, **Then** the updated assignments are saved and reflected in the exercise detail.
4. **Given** a muscle group exists, **When** the user renames it, **Then** the updated name appears on all exercises that reference it.
5. **Given** a muscle group exists, **When** the user deletes it, **Then** it is removed from all exercises that referenced it; those exercises remain in the library (not deleted).
6. **Given** a new muscle group is created, **When** the user edits any exercise, **Then** the new muscle group is available for selection.

---

### Edge Cases

- Exercise names that differ only in capitalisation or leading/trailing whitespace are treated as duplicates.
- A name consisting entirely of whitespace is rejected as empty (applies to both exercises and muscle groups).
- Muscle group names follow the same uniqueness rules as exercise names (case-insensitive, trimmed).
- Deleting an exercise clears any routine slots that reference it; the slot remains, unassigned.
- Deleting a muscle group removes it from exercises that referenced it; if an exercise has no remaining muscle groups after deletion, it is left with zero groups (it remains valid in the library).
- An exercise may not be saved with zero muscle groups during create or edit — at least one must be selected.

## Requirements *(mandatory)*

### Functional Requirements

**Exercise management**

- **FR-001**: The system MUST pre-populate the exercise library on first launch with the 24 exercises and their muscle group assignments listed in the Seed Data section.
- **FR-002**: The routine builder MUST provide a searchable exercise dropdown that lists all exercises from the library.
- **FR-003**: The workout log screen MUST provide a searchable exercise dropdown that lists all exercises from the library.
- **FR-004**: Users MUST be able to create a new exercise by providing a name (1–100 characters, non-empty after trimming) and selecting at least one muscle group.
- **FR-005**: The system MUST reject duplicate exercise names (case-insensitive comparison after trimming whitespace).
- **FR-006**: All exercises MUST persist across app sessions.
- **FR-007**: Users MUST be able to rename any exercise; the updated name MUST be reflected in the exercise dropdown, all routines referencing it, and all existing workout log entries referencing it.
- **FR-008**: Users MUST be able to edit the muscle group assignments of any exercise (add or remove groups), subject to the constraint that at least one group must remain assigned.
- **FR-009**: Users MUST be able to delete any exercise from the library. Deletion MUST remove the exercise from the dropdown and from any routine slots that reference it. Deletion MUST NOT delete or alter existing workout log entries.
- **FR-010**: The exercise dropdown MUST support filtering by partial name match (case-insensitive).
- **FR-011**: The exercise list MUST be displayed in alphabetical order.

**Muscle group management**

- **FR-012**: The system MUST pre-populate the muscle group list on first launch with: Back, Biceps, Calves, Chest, Core, Forearms, Glutes, Hamstrings, Quads, Rear Delts, Shoulders, Triceps.
- **FR-013**: Users MUST be able to create a new muscle group by providing a name (1–50 characters, non-empty after trimming).
- **FR-014**: The system MUST reject duplicate muscle group names (case-insensitive comparison after trimming).
- **FR-015**: Users MUST be able to rename any muscle group; the updated name MUST be reflected on all exercises that reference it.
- **FR-016**: Users MUST be able to delete any muscle group. Deletion MUST remove that group from all exercises that referenced it. Exercises are not deleted.
- **FR-017**: The Exercise Library screen MUST provide access to manage both exercises and muscle groups (create, rename, delete for each).

### Seed Data

| Exercise | Muscle Groups |
|---|---|
| Abs (BW) | Core |
| Assisted Chin-up | Back, Biceps |
| Barbell Squat | Quads, Hamstrings, Glutes |
| Bench Press | Chest, Triceps |
| Cable Curl (rope) | Biceps |
| Cable Lateral Raise | Shoulders |
| Cable Pushdown (rope) | Triceps |
| Cable Row | Back, Biceps |
| Close Grip Bench Press | Triceps, Chest |
| DB Lateral Raise | Shoulders |
| Dips (BW) | Chest, Triceps |
| Dumbbell Overhead Press | Shoulders, Triceps |
| Dumbbell RDL | Hamstrings, Glutes |
| Hack Squat Machine | Quads, Glutes |
| Hammer Curl | Biceps, Forearms |
| Incline Press Machine | Chest, Shoulders |
| Lat Pull Down | Back, Biceps |
| Leg Curl Machine | Hamstrings |
| Leg Extension Machine | Quads |
| Rear Delt Pec Deck | Rear Delts |
| Reverse Curl | Forearms, Biceps |
| Seated Calf Machine | Calves |
| Seated Row | Back, Biceps |
| Wrist Curl | Forearms |

### Key Entities

- **Exercise**: Represents a named physical movement. Key attributes: unique identifier, name, creation date, one or more assigned muscle groups. All exercises are equal — no distinction between pre-seeded and user-created.
- **Muscle Group**: Represents a body region targeted by exercises. Key attributes: unique identifier, name. Used as a classification tag on exercises.
- **Exercise–Muscle Group Assignment**: A many-to-many relationship linking exercises to their target muscle groups. An exercise must have at least one assignment.
- **Exercise Library**: The complete, ordered collection of exercises available for selection. Used by the routine builder and the workout log screen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 24 pre-seeded exercises with their muscle group assignments are available on first use without any user action.
- **SC-002**: A user can locate any exercise by name in under 5 seconds using the search filter.
- **SC-003**: A user can add a new exercise (with muscle groups) in under 45 seconds from the point of opening the Exercise Library.
- **SC-004**: 100% of exercises and muscle groups created by the user are still present after closing and reopening the app.
- **SC-005**: Deleting an exercise does not remove or alter any existing workout log entries that referenced it.
- **SC-006**: Deleting a muscle group does not delete any exercises; affected exercises lose only the deleted group assignment.

## Clarifications

### Session 2026-05-27

- Q: How do users access exercise management (rename/delete)? → A: Via a dedicated "Exercise Library" screen in the main navigation.
- Q: Should default and custom exercises be treated differently? Should deletion be blocked when an exercise is referenced? → A: No distinction between default and custom — all exercises support full CRUD. Deletion does not cascade to workout log entries (log entries are preserved); routine slots that reference the deleted exercise are cleared.
- Q: Each exercise must have an assigned muscle group. Can an exercise be assigned to exactly one muscle group, or multiple? → A: One or more muscle groups per exercise (many-to-many). Users can also manage the muscle group list from the Exercise Library screen.

## Assumptions

- The app currently has no exercise entity or library; exercises are either hardcoded or not yet modelled as first-class data.
- All data is stored locally (no server sync), consistent with the app's local-first architecture.
- The routine builder and workout log screens already exist; this feature adds an exercise picker to them rather than rebuilding those screens.
- "Hack Squat Machine" is the intended name for the item listed as "Heck squat machine" in the source list — treated as a typo.
- When an exercise is deleted, routine slots referencing it become empty (the slot remains, unassigned).
- Workout log entries store the exercise name (or a reference that survives deletion) so that history remains readable after an exercise is removed from the library.
- If an exercise ends up with zero muscle group assignments after a muscle group deletion, it is not automatically deleted — it remains in the library with no groups. The UI may display such exercises with a warning or placeholder.
- Substring name matching is sufficient for the search filter in v1.
