# Feature Specification: Routine Inline Editing & UI Consistency

**Feature Branch**: `018-routine-inline-editing`
**Created**: 2026-06-18
**Status**: Draft
**Input**: User description: "UI improvements: consistent add (plus) buttons; move routine editing into the in-progress workout view (delete set, delete exercise, add exercise, add/remove set buttons under the sets); better exercise cards (card per exercise, whole card green when all sets complete, alternating gray set backgrounds); drag-and-drop reordering of exercises."

## Clarifications

### Session 2026-06-18

- Q: How is an exercise's target rep range edited now that the dedicated routine editor is removed? → A: Via a per-exercise three-dots (overflow) menu on the exercise card; that menu also holds the delete-exercise action.
- Q: With the dedicated editor gone, how does creating a new routine work? → A: The + action instantly creates a routine with a default name and opens it in the merged view, where the user adds exercises and renames inline.
- Q: How is a routine opened from the routine list, and where does routine-level delete live? → A: Tapping a routine row opens the merged view directly (single entry point); routine-level delete lives in a three-dots menu on the routine list row.
- Q: Which destructive actions require a confirmation step? → A: Deleting an exercise or a routine requires a confirmation dialog; removing a set is immediate (no confirmation).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a routine while working out (Priority: P1)

A user opens one of their routines and lands in a single view where they can both log their sets and reshape the routine. From this one view they can rename the routine, add an exercise, remove an exercise, add a set to an exercise, and remove a set — without ever leaving for a separate editor screen. Every structural change is saved to the routine itself, so the next time they open it the routine reflects those changes.

**Why this priority**: This is the core of the request. It removes an entire separate screen (the routine editor) and consolidates routine creation/editing and workout logging into one place, which is where the user spends their time. Without it, the rest of the improvements have no consolidated home.

**Independent Test**: Open a routine, rename it, add an exercise, delete an exercise, add a set to an exercise, and remove a set. Leave the view and reopen the same routine; confirm all structural changes persisted. Confirm logging a workout still works.

**Acceptance Scenarios**:

1. **Given** a user is viewing a routine, **When** they tap the add-set control beneath an exercise's sets, **Then** a new empty set row appears under that exercise and the routine now stores one more set for that exercise (up to the maximum of 5).
2. **Given** an exercise already has more than one set, **When** the user taps the remove-set control, **Then** the last set row is removed and the routine stores one fewer set (down to a minimum of 1).
3. **Given** an exercise has exactly one set, **When** the user looks at the remove-set control, **Then** removing below one set is prevented (control disabled or hidden).
4. **Given** an exercise already has 5 sets, **When** the user looks at the add-set control, **Then** adding beyond 5 sets is prevented (control disabled or hidden).
5. **Given** a user is viewing a routine, **When** they choose to add an exercise, **Then** they can pick an exercise from the library, it is appended to the routine, and it persists to the routine template.
6. **Given** a user is viewing a routine, **When** they open an exercise's three-dots menu and delete it, **Then** that exercise is removed from the routine and the remaining exercises keep a valid, gap-free order.
7. **Given** a user is viewing a routine, **When** they open an exercise's three-dots menu and change its target rep range, **Then** the new range persists to the routine and the displayed target updates.
8. **Given** a user is viewing a routine, **When** they rename the routine, **Then** the new name is saved to the routine and shown wherever the routine is listed.
9. **Given** the user has made structural edits, **When** they reopen the routine later, **Then** the routine reflects all persisted edits (name, exercises, set counts, rep ranges, order).
10. **Given** the merged view, **When** the user fills in weight/reps and marks sets complete and submits, **Then** a workout is logged exactly as before this change.

---

### User Story 2 - Reorder exercises by dragging (Priority: P2)

While viewing a routine, the user drags an exercise card to a new position to change the order exercises appear in. The new order is saved to the routine.

**Why this priority**: Reordering is an expected part of routine editing and replaces the older up/down arrow buttons with a more direct, modern interaction. It depends on the consolidated view (US1) for its home but delivers clear standalone value.

**Independent Test**: In a routine with at least three exercises, drag the third exercise to the top. Confirm the visual order updates, then reopen the routine and confirm the new order persisted.

**Acceptance Scenarios**:

1. **Given** a routine with multiple exercises, **When** the user drags an exercise card and drops it at a new position, **Then** the exercise list visually reorders to match.
2. **Given** a reorder has happened, **When** the user reopens the routine, **Then** the persisted order matches the order set by dragging.
3. **Given** a drag is in progress, **When** the user releases over an invalid target or cancels, **Then** the original order is preserved.

---

### User Story 3 - Clearer exercise cards with completion feedback (Priority: P2)

Each exercise in the routine view is presented as a distinct card. Within a card, set rows alternate with a subtle gray background so individual sets are easy to scan. When every set in an exercise is marked complete, the entire card turns green to give an at-a-glance sense of progress.

**Why this priority**: Visual clarity and progress feedback directly affect how usable the logging experience feels during a workout. It is independent of the editing and drag features but shares the same view.

**Independent Test**: Open a routine and confirm each exercise sits in its own card with alternating gray set rows. Mark all sets of one exercise complete and confirm that card turns green while incomplete cards do not.

**Acceptance Scenarios**:

1. **Given** the routine view, **When** it renders, **Then** each exercise is contained in its own visually distinct card.
2. **Given** an exercise card with multiple sets, **When** it renders, **Then** the set rows alternate background shading (e.g. every other row a subtle gray).
3. **Given** an exercise card, **When** all of its sets are marked complete, **Then** the whole card adopts a green appearance.
4. **Given** an exercise card whose sets are not all complete, **When** the user marks the final remaining set complete, **Then** the card transitions to the green/complete appearance.
5. **Given** an all-complete card, **When** the user un-marks a set, **Then** the card returns to its normal (non-green) appearance.

---

### User Story 4 - Consistent add (plus) buttons (Priority: P3)

Across the app, the action to add a new item is presented the same way — a single plus button consistent with the one already used on the workout log and routine list screens — rather than a top-of-screen "Add exercise" / "Add muscle group" text button.

**Why this priority**: Improves consistency and discoverability, but is cosmetic relative to the editing workflow. Fully independent of the other stories.

**Independent Test**: Visit the exercise library (Exercises and Muscle Groups tabs) and confirm adding is done via a plus button matching the log/routine screens, with the correct action for the active tab.

**Acceptance Scenarios**:

1. **Given** the exercises area, **When** the user wants to add an exercise, **Then** they use a plus button styled and placed consistently with the workout log and routine list screens, not a top contained text button.
2. **Given** the muscle groups area, **When** the user wants to add a muscle group, **Then** they use the same plus-button pattern, and the action adds a muscle group.
3. **Given** a screen with tabs that both support adding, **When** the user switches tabs, **Then** the plus button's action matches the currently active tab.

---

### Edge Cases

- **Empty routine**: A routine with no exercises shows an empty state and still allows adding the first exercise and renaming.
- **Removing an exercise with logged values**: If the user has entered weight/reps for a set and then deletes that exercise (or set), the entered values for the removed items are discarded; remaining entries are preserved.
- **Set-count boundaries**: Add-set is unavailable at 5 sets; remove-set is unavailable at 1 set, in both the UI and the saved routine.
- **Reorder during data entry**: Reordering exercises must not lose weight/reps/completion the user has already entered for any exercise.
- **Duplicate add**: Adding an exercise that is already in the routine behaves consistently with the prior editor's behavior (allowed/blocked as it is today).
- **Concurrent draft vs. template**: Structural edits change the routine template; previously-entered session values stay associated with the correct exercises/sets after a structural change.
- **In-flight drag interruptions**: Navigating away or backgrounding the app mid-drag leaves the routine order unchanged.

## Requirements *(mandatory)*

### Functional Requirements

#### Inline routine editing (replaces the separate editor)

- **FR-001**: The application MUST allow viewing and editing a routine within the in-progress workout view; a separate dedicated routine-editor screen MUST no longer be required.
- **FR-002**: Users MUST be able to rename a routine from within this view, and the new name MUST be saved to the routine template.
- **FR-003**: Users MUST be able to add an exercise to the routine from within this view by selecting from the exercise library; the added exercise MUST persist to the routine template and appear at the end of the list.
- **FR-004**: Users MUST be able to delete an exercise from the routine within this view via a per-exercise three-dots (overflow) menu on the exercise card; the deletion MUST persist and the remaining exercises MUST retain a valid, contiguous order.
- **FR-004a**: Each exercise card MUST provide a three-dots (overflow) menu that holds exercise-level actions, including editing the exercise's target rep range and deleting the exercise.
- **FR-004b**: Users MUST be able to edit an exercise's target rep range (min–max reps, within the existing 1–99 range) from the three-dots menu; the new range MUST persist to the routine template and update the displayed target.
- **FR-005**: Users MUST be able to add a set to an exercise via a control placed beneath that exercise's set rows; the added set MUST persist to the routine template.
- **FR-006**: Users MUST be able to remove a set from an exercise via a control placed beneath that exercise's set rows; the removal MUST persist to the routine template.
- **FR-007**: The add/remove-set controls MUST be presented as neat, simple outlined buttons located underneath the set rows for each exercise.
- **FR-008**: The number of sets per exercise MUST remain within the existing 1–5 range; the add-set control MUST be unavailable at 5 sets and the remove-set control MUST be unavailable at 1 set.
- **FR-009**: All structural editing controls (rename, add/delete exercise, add/remove set, reorder handles) MUST be visible inline alongside the logging inputs, without requiring a separate edit mode.
- **FR-010**: Structural edits MUST be written to the routine template (the saved routine), so that reopening the routine reflects the changes.
- **FR-011**: The existing workout-logging behavior in this view (entering weight/reps, marking sets complete, draft auto-save, and submitting a logged workout) MUST continue to work unchanged.
- **FR-012**: Creating a new routine (via the routine list + action) MUST immediately create a routine with a default name and open it in the merged view with an empty exercise list, where the user adds exercises and can rename it inline.
- **FR-013**: Entry points that previously opened the separate routine editor (e.g. "edit" on the routine list, the create-routine action) MUST route to this consolidated view.
- **FR-013a**: Tapping a routine row in the routine list MUST open the merged view directly as the single entry point (no separate "start" vs "edit" choice); routine-level delete MUST be available from a three-dots menu on the routine list row.
- **FR-013b**: Deleting an exercise or deleting a routine MUST require a confirmation step before the deletion is applied; removing a set MUST apply immediately without confirmation.

#### Drag-and-drop reordering

- **FR-014**: Users MUST be able to reorder exercises within a routine by dragging and dropping exercise cards.
- **FR-015**: A completed reorder MUST persist the new exercise order to the routine template.
- **FR-016**: A cancelled or invalid drag MUST leave the existing order unchanged.
- **FR-017**: Reordering MUST preserve any weight/reps/completion values the user has already entered for each exercise.

#### Exercise cards & completion feedback

- **FR-018**: Each exercise in the routine view MUST be displayed within its own visually distinct card.
- **FR-019**: Set rows within an exercise card MUST use alternating background shading (subtle gray) to aid scanning.
- **FR-020**: When all sets of an exercise are marked complete, the entire exercise card MUST adopt a green appearance; when not all sets are complete, the card MUST use its normal appearance. The appearance MUST update reactively as sets are completed/uncompleted.

#### Consistent add buttons

- **FR-021**: The add action on the exercise library (both the Exercises and Muscle Groups areas) MUST be presented as a plus button consistent in style and placement with the plus button used on the workout log and routine list screens, replacing the prior top-of-screen "Add exercise" / "Add muscle group" text buttons.
- **FR-022**: On a screen where multiple tabs each support adding, the plus button's action MUST correspond to the currently active tab.

### Key Entities *(include if data involved)*

- **Routine**: A named, reusable workout template. Attributes: name, ordered list of routine exercises. Renaming, exercise membership, set counts, and order are all edited inline and persisted.
- **Routine Exercise**: An exercise entry within a routine. Attributes: exercise (by name), target rep range, set count (1–5), and position (ordering within the routine).
- **Set (within an exercise)**: A single set the user logs during a workout. Has logged weight, reps, and a completion flag. Set count is governed by the routine exercise's set count; per-set logged values and completion are session/draft state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can perform a full routine edit — rename, add an exercise, delete an exercise, add a set, remove a set, and reorder exercises — entirely within one view, with zero navigation to a separate editor screen.
- **SC-002**: 100% of structural edits (rename, add/delete exercise, add/remove set, reorder) are reflected when the routine is reopened.
- **SC-003**: The add action is presented identically (same plus-button pattern) across the workout log, routine list, and exercise library screens — no screen still uses the old top "Add …" text button for these actions.
- **SC-004**: When all sets of an exercise are completed, the exercise's card visibly turns green within the same interaction, with no manual refresh.
- **SC-005**: A user can reorder exercises by dragging in a routine of 3+ exercises and the new order persists across reopening, with no loss of already-entered set data.
- **SC-006**: Existing workout logging from this view continues to succeed (a workout can be entered and logged) after the changes.

## Assumptions

- The "in-progress view" referred to is the active routine workout screen (the screen reached by opening/starting a routine), which already renders per-set weight/reps/completed inputs and a "Log Workout" submit. This becomes the single place to both edit and run a routine.
- Structural edits persist immediately to the saved routine template (per user direction: "do all in db"), rather than being session-only or save-on-finish.
- The set-count range stays at the current 1–5 limit; no data-model change to the set-count constraint is needed.
- Editing controls are always visible inline; there is no separate edit-mode toggle.
- The exercise library is a tabbed screen (Exercises / Muscle Groups); a single plus button there switches its action to match the active tab.
- Drag-and-drop is implemented with the `@dnd-kit` library family (the "react-dnd-kit" the user referenced), consistent with the existing reorder concept (the `position` ordering already stored per routine exercise).
- The existing rep-range and target-set concepts on a routine exercise are retained; this feature changes where and how they are edited, not their meaning. Set count is edited via the add/remove-set buttons beneath the sets; the target rep range (and exercise deletion) is edited via the exercise card's three-dots menu.
- Reordering and set add/remove operate on the routine's stored ordering/set-count and remain gap-free and within constraints, matching the invariants the prior editor maintained.
