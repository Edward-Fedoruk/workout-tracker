# Feature Specification: Routine UI Improvements

**Feature Branch**: `016-routine-ui-improvements`  
**Created**: 2026-06-12  
**Status**: Draft

## Clarifications

### Session 2026-06-12

- Q: What icon should be used for the set label on each set row? → A: The MUI `Looks*` numbered icon series (`LooksOneIcon`, `LooksTwoIcon`, `Looks3Icon`, etc.) — the same icons already used for set columns in the workout log table.
- Q: Should prefill values populate as actual input values or as placeholder hint text? → A: Actual input values. The set completion checkbox gate ensures the user consciously reviews each set before the form can be submitted, making real prefill safe.
- Q: Which view hosts the three-dots Edit/Delete menu — RoutineEditor or RoutineWorkout? → A: RoutineEditor header — the three-dots menu sits in the top-right of the routine configuration screen, mirroring the ExerciseDetail pattern.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Workout from List (Priority: P1)

A user visits the Routines list, sees their routines displayed with an exercise tag list underneath each routine name, and taps a prominent green Start button directly on the card to begin the workout — without needing to navigate into the routine first.

**Why this priority**: Reducing the steps to start a workout is the highest-value interaction on this screen.

**Independent Test**: Can be fully tested by opening the Routines list and verifying each card shows exercise name tags and a green Start button that navigates to the routine workout view.

**Acceptance Scenarios**:

1. **Given** a routine with exercises, **When** the list is displayed, **Then** each card shows a row of exercise name chips/tags beneath the routine name instead of the "X exercises" count chip.
2. **Given** a routine card, **When** the user views it, **Then** a green Start button is visible next to the routine title (or prominently within the card).
3. **Given** a routine with no exercises, **When** the Start button is tapped, **Then** it is disabled with a tooltip explaining exercises must be added first.

---

### User Story 2 - Complete Sets and Log Workout (Priority: P1)

During a routine workout, a user marks each set as complete via a checkbox on the right side of each set row. Completed rows are highlighted green. The Log Workout button is disabled until every set across all exercises is checked. Completion state persists across page reloads (saved to the existing draft mechanism).

**Why this priority**: Core workout tracking flow — ensures intentional logging and prevents accidental partial submissions.

**Independent Test**: Open a routine workout, check/uncheck set checkboxes, reload the page, and verify state is restored. Verify Log Workout is disabled until all sets are checked.

**Acceptance Scenarios**:

1. **Given** a set row, **When** the user taps its checkbox, **Then** the row background turns green and the checkbox is marked.
2. **Given** not all sets are checked, **When** the user views the Log Workout button, **Then** the button is disabled.
3. **Given** all sets are checked, **When** the user views the Log Workout button, **Then** the button is enabled.
4. **Given** the user has checked some sets and reloads the page, **When** the workout draft is restored, **Then** the checked state for each set is also restored.
5. **Given** a checked set row, **When** the user taps the checkbox again, **Then** the row unchecks and loses the green highlight.

---

### User Story 3 - Prefilled Set Values (Priority: P2)

When a user opens a routine workout, weight and reps inputs are pre-filled with actual values from the user's last logged sets for each exercise. If the last set at a given position had no value, the app walks backwards through previous sets at that position to find one. Prefilled values appear as real input values (not just placeholders), so the user can log the same workout without re-entering data.

**Why this priority**: Significantly reduces friction for repeat workouts — the most common use case.

**Independent Test**: Log a workout for a routine, then start the same routine again and verify inputs are pre-populated with the previously logged values.

**Acceptance Scenarios**:

1. **Given** the user has previously logged a workout for this exercise, **When** the routine workout opens, **Then** weight and reps fields are pre-filled with the values from the matching set position of the last workout.
2. **Given** the last workout's set N had no weight/reps recorded, **When** filling set N, **Then** the app uses values from the same position in the previous workout, continuing backwards until a value is found.
3. **Given** no prior workout history for the exercise, **When** the routine workout opens, **Then** inputs remain empty (no prefill).

---

### User Story 4 - Routine View Polish (Priority: P2)

In the routine workout view, each exercise title shows the exercise's avatar/icon on the left (matching the exercise list style), set labels use a set icon instead of "Set N" text, and the weight field label reads "kg" instead of "Weight (kg)".

**Why this priority**: Visual consistency and clarity polish that improves the workout experience.

**Independent Test**: Open any routine workout and verify: avatar appears left of exercise name, set rows show icons instead of text labels, weight field is labelled "kg".

**Acceptance Scenarios**:

1. **Given** an exercise in the routine workout, **When** its section header renders, **Then** an avatar/icon (exercise image or fallback fitness icon) appears to the left of the exercise name, matching the exercise list display.
2. **Given** any set row, **When** rendered, **Then** a numbered set icon (`LooksOneIcon`, `LooksTwoIcon`, `Looks3Icon`, etc. from MUI) replaces the "Set N" text label on the left — the same icons already used for set columns in the workout log table.
3. **Given** the weight input field, **When** rendered, **Then** its label reads "kg" not "Weight (kg)".

---

### User Story 5 - List Page Layout & Add Button Convention (Priority: P3)

The Routines list page title matches the size used on the Workout Log page (h6), Edit and Delete actions are removed from the list cards and accessible only from within the routine detail/view, and the Add Routine button is replaced by a circular FAB button positioned the same way as on the Workout Log screen.

**Why this priority**: Consistency and de-cluttering of the list; lower priority since it is purely structural.

**Independent Test**: Open the Routines page and verify: title is h6 size, cards have no Edit/Delete buttons, a FAB is visible at the bottom-right, and routine detail view has a three-dots menu with Edit and Delete options.

**Acceptance Scenarios**:

1. **Given** the Routines list page, **When** rendered, **Then** the page title uses the same typographic variant as "Workout Log" (h6).
2. **Given** a routine card, **When** rendered, **Then** no Edit or Delete buttons are present on the card.
3. **Given** the Routines list page, **When** rendered, **Then** a circular FAB button with an add icon is fixed at the bottom-right, styled and positioned identically to the one on the Workout Log screen.
4. **Given** a routine is opened (routine editor/detail view), **When** a three-dots (⋮) menu is tapped, **Then** Edit and Delete options appear, matching the pattern used in the Exercise Detail view.

---

### Edge Cases

- What happens when a routine has many exercises — do the exercise tags wrap gracefully on small screens?
- What happens if a set checkbox is checked but then the user edits the weight/reps — should the check remain or reset? (Assumption: check remains; user must uncheck manually.)
- What happens when the draft is for a different routine — completion state should not be restored (existing draft routing logic handles this).
- What happens when an exercise has no image — avatar falls back to the default fitness icon.

## Requirements *(mandatory)*

### Functional Requirements

**Routine List View**

- **FR-001**: Each routine card MUST display a list of exercise name tags/chips beneath the routine title instead of the "X exercises" count chip.
- **FR-002**: Each routine card MUST show a green Start button prominently (next to or within the card title area); the button MUST be disabled for routines with no exercises.
- **FR-003**: Edit and Delete buttons MUST be removed from the routine list cards.
- **FR-004**: The Add Routine action MUST be presented as a circular FAB button with an add icon, fixed at the bottom-right of the screen at the same position as the FAB on the Workout Log screen.
- **FR-005**: The Routines page title MUST use the same typographic variant (h6) as the Workout Log page title.

**Routine Workout View**

- **FR-006**: Each exercise section header MUST display an avatar/icon to the left of the exercise name, using the exercise's image if available and a fallback fitness icon otherwise, consistent with the exercise list display.
- **FR-007**: Each set row MUST show the corresponding numbered MUI Looks icon (`LooksOneIcon` for set 1, `LooksTwoIcon` for set 2, `Looks3Icon` for set 3, etc.) on the left instead of "Set N" text, consistent with the set column icons in the workout log table.
- **FR-008**: The weight input field label MUST read "kg" (not "Weight (kg)").
- **FR-009**: Weight and reps inputs MUST be pre-filled with actual values (not placeholders) from the most recent workout log for that exercise at the matching set position. If the matching position has no recorded value, the app MUST walk backwards through previous logged sets at the same position until a value is found.
- **FR-010**: Each set row MUST include a checkbox on the right side. Tapping it toggles the set's completion state.
- **FR-011**: A completed set row MUST be visually highlighted with a green background.
- **FR-012**: The Log Workout button MUST be disabled as long as any set in any exercise is unchecked.
- **FR-013**: Set completion state MUST be persisted to the existing draft storage alongside weight/reps values, so it is restored on page reload exactly as entered values are.

**Routine Detail / Editor View**

- **FR-014**: The RoutineEditor screen MUST include a three-dots (⋮) icon button in its header (top-right), containing Edit name and Delete options, following the same pattern as the Exercise Detail view header.

### Key Entities

- **RoutineWorkoutDraft**: Extended to include per-set `completed: boolean` alongside existing `weight` and `reps` fields.
- **LastExerciseSets**: Used for prefilling; the lookup must find the nearest previous value when the exact position is null.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can start a routine workout in one tap from the list screen (no intermediate navigation required).
- **SC-002**: 100% of set rows display a completion checkbox; the Log Workout button is unreachable while any set is unchecked.
- **SC-003**: On reopening a routine workout, all previously entered values and checked states are restored with zero data loss.
- **SC-004**: Pre-filled input values (not placeholders) appear for every set position that has prior workout history.
- **SC-005**: The Routines list and workout views are visually consistent with the Workout Log and Exercise pages (icon style, FAB, title size, three-dots menu).

## Assumptions

- The existing `StoredSetValues` type (per-set `{ weight, reps }` object array) will be extended to include a `completed` boolean field; this is additive and backward-compatible.
- Set icon means the MUI `Looks*` numbered icon series (`LooksOneIcon`, `LooksTwoIcon`, `Looks3Icon`, `Looks4Icon`, `Looks5Icon`) — the same icons already used for set columns in the workout log table.
- "Previous set" for prefill fallback means the same set-index position in chronologically earlier workout logs for the same exercise name, not a different set index within the same workout.
- The green Start button on the routine card is positioned to the right of the routine title within the card, keeping the card layout compact.
- Edit and Delete in the routine detail view are accessed via a three-dots icon button in the top-right of the header, identical in pattern to ExerciseDetailView.
- Exercise tags on the list card show only exercise names (not sets/reps); long tag lists wrap to multiple lines.
