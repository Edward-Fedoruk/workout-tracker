# Feature Specification: Rep Range for Routine Exercises

**Feature Branch**: `006-reps-range`  
**Created**: 2026-05-28  
**Status**: Draft  
**Input**: User description: "When creating a routine, user should be able to specify both minimum and maximum number of reps instead of a single "suggested reps" field."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Rep Range When Adding Exercise to Routine (Priority: P1)

A user building a routine wants to specify a rep range (e.g., 8–12 reps) for each exercise rather than a single target number. This better reflects how strength training programs are designed — a range guides effort without locking in a fixed number.

**Why this priority**: Core of the feature request. Without this, the feature doesn't exist. Delivers immediate value as soon as the editor is updated.

**Independent Test**: Open the routine editor, add an exercise, enter a min rep value and a max rep value, save — the routine is saved with both values visible.

**Acceptance Scenarios**:

1. **Given** the user is in the routine editor, **When** they add an exercise, **Then** they see two separate rep fields: "Min Reps" and "Max Reps" (not a single "Suggested Reps" field).
2. **Given** the user enters min = 8 and max = 12, **When** they save the routine, **Then** the exercise is stored with min_reps = 8 and max_reps = 12.
3. **Given** the user enters min = 5 and max = 5, **When** they save, **Then** the exercise is stored correctly (equal min and max is valid — represents a fixed target).
4. **Given** the user enters min > max (e.g., min = 12, max = 8), **When** they attempt to save, **Then** the form shows a validation error and does not save.
5. **Given** the user enters a value below 1 or above 99 for either field, **When** they attempt to save, **Then** the form shows a validation error.

---

### User Story 2 - View Rep Range on Routine Card (Priority: P2)

A user viewing their saved routines wants to see the rep range for each exercise displayed in a readable format (e.g., "8–12 reps" or "5 reps" when min equals max).

**Why this priority**: Persisting data without surfacing it in the UI is incomplete. This closes the loop so the feature is fully usable.

**Independent Test**: Save a routine with rep ranges, navigate to the routine list — the cards show rep ranges for each exercise.

**Acceptance Scenarios**:

1. **Given** a routine exercise has min_reps = 8 and max_reps = 12, **When** the user views the routine card, **Then** the rep range is displayed as "8–12 reps".
2. **Given** a routine exercise has min_reps = 5 and max_reps = 5, **When** the user views the routine card, **Then** it is displayed as "5 reps" (not "5–5 reps").

---

### User Story 3 - Rep Range Pre-filled When Starting a Workout from Routine (Priority: P3)

When a user starts a workout based on a routine, the rep range is surfaced as guidance during the workout — so they know what target to aim for on each set.

**Why this priority**: Closes the full user journey from planning to execution. Lower priority because the workout-start flow is a downstream consumer; the first two stories are prerequisite.

**Independent Test**: Start a workout from a routine that has rep ranges set — the workout form shows the range as a hint or label next to each exercise's set inputs.

**Acceptance Scenarios**:

1. **Given** a routine exercise has min_reps = 8 and max_reps = 12, **When** the user starts a workout from that routine, **Then** the workout entry form shows "Target: 8–12 reps" (or equivalent guidance) for that exercise.
2. **Given** a routine exercise has equal min and max reps (e.g., both = 5), **When** the user starts a workout, **Then** the guidance shows "Target: 5 reps".

---

### Edge Cases

- What happens to routines created before this feature that have a single `suggested_reps` value? Existing data must be migrated so those routines remain usable — the migrated value should become both min and max reps (preserving the original intent as a fixed target).
- What happens if a user edits an existing routine exercise that was created before this change? The edit form must pre-populate both fields correctly from the migrated values.
- What if min and max are equal? This is valid and should be displayed as a single number rather than a range (e.g., "5 reps" not "5–5 reps").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The routine exercise editor MUST replace the single "Suggested Reps" field with two fields: "Min Reps" and "Max Reps".
- **FR-002**: Both Min Reps and Max Reps MUST be required fields; a routine exercise cannot be saved without both values.
- **FR-003**: Min Reps and Max Reps MUST each accept whole numbers between 1 and 99 inclusive.
- **FR-004**: The system MUST reject saves where Min Reps is greater than Max Reps, displaying a clear validation error.
- **FR-005**: Saved routine exercises MUST store both min_reps and max_reps values.
- **FR-006**: Routine cards and detail views MUST display the rep range in a human-readable format: "X–Y reps" when min ≠ max, or "X reps" when min = max.
- **FR-007**: When starting a workout from a routine, the workout entry form MUST display the rep range as a read-only label (e.g., "Target: 8–12 reps") next to each exercise's set inputs. The reps input field MUST remain empty — it is not pre-filled from the range.
- **FR-008**: Existing routine exercises MUST be migrated so that the previous single `suggested_reps` value becomes both min_reps and max_reps (preserving a fixed-target interpretation).

### Key Entities

- **Routine Exercise**: An exercise slot within a saved routine. Currently holds `suggested_reps` (single integer) and `suggested_sets`. After this change, holds `min_reps` and `max_reps` instead of `suggested_reps`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create or edit a routine exercise with a rep range in under 30 seconds — no more steps than the current single-field flow.
- **SC-002**: 100% of existing routine exercises remain accessible and display correct rep values after the migration (no data loss).
- **SC-003**: The validation preventing min > max catches 100% of invalid inputs before saving.
- **SC-004**: Rep range guidance is visible on the workout entry form for every exercise sourced from a routine with rep ranges set.

## Clarifications

### Session 2026-05-28

- Q: Does the rep range apply to all sets of an exercise uniformly, or independently per set? → A: One range per exercise, shared across all sets (e.g., "3 sets × 8–12 reps"). Per-set ranges are out of scope.
- Q: In the workout entry form, does the reps input pre-fill from the routine's rep range, or is guidance display-only? → A: Display-only label ("Target: 8–12 reps") next to the set; reps input stays empty.

## Assumptions

- Min Reps and Max Reps are both whole numbers (no decimals or fractions).
- The valid range of 1–99 reps per field matches the existing constraint on the current `suggested_reps` field and is sufficient for all exercise types in scope.
- Equal min and max values (a fixed target) is intentionally supported — it should not be blocked or warned about.
- The migration of existing `suggested_reps` data to (min_reps, max_reps) pairs copies the single value to both fields; no user action is required.
- The rep range is guidance only during workouts — displayed as a read-only label, not pre-filled into the reps input. The user enters their actual rep count freely.
- Sets (suggested_sets) are not part of this change; only the reps field is being updated.
- One rep range applies uniformly to all sets of an exercise in a routine (e.g., "3 sets × 8–12 reps"). Per-set rep ranges are explicitly out of scope.
