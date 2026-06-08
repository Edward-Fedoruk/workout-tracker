# Feature Specification: Routine Draft Persistence

**Feature Branch**: `011-routine-draft-persistence`
**Created**: 2026-06-08
**Status**: Draft
**Input**: User description: "Add persistence layer to routine tracking. An active routine that is being filled must be cached in LocalStorage as a draft in case user accidentally exits from the editor while filling out the routine. When the app starts let user know if there's an active routine and suggest to continue it. Let user leave active routine editor at any time."

## Clarifications

### Session 2026-06-08

- Q: Should draft persistence use localStorage (as originally described) or go through SQLite to comply with the project's single-persistence-layer rule? → A: SQLite draft table — store draft as a row in the DB, consistent with all other app data.
- Q: When the user returns to the Routines tab after in-app navigation away from a draft, how is the draft surfaced? → A: Land on the Routines list with the in-progress routine visually highlighted (e.g., "In Progress" badge), requiring one tap to reopen.
- Q: Should the draft store a snapshot of the routine's exercise list or only the user's entered values keyed to the live routine? → A: Live — draft stores only user inputs (weights/reps per exercise); the exercise list is always re-read from the current routine on resume.
- Q: Where should the app-startup draft notification appear? → A: A badge on the Routines tab icon (no modal, no banner); the in-progress routine also carries a badge in the Routines list. No separate prompt is shown. Deleting a routine must immediately clean up any draft associated with it.
- Q: Is an explicit Discard button inside the workout form needed, given that starting any routine already replaces the draft automatically? → A: Yes — keep the Discard button inside the form with a confirmation dialog. Starting a different routine replaces the draft but does not cover the case where the user wants to abandon the same routine session and start it fresh.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Resume an Interrupted Routine Workout (Priority: P1)

A user starts a routine-based workout session, partially fills in their sets/reps/weights, then accidentally navigates away (e.g., presses back, switches tabs, or closes the browser tab). When they return to the app — even after a full page reload — the Routines tab icon displays a badge indicating an in-progress session. The user taps the Routines tab, sees the in-progress routine highlighted with a badge in the list, taps it, and is taken back to the routine workout form with all previously entered values restored.

**Why this priority**: This is the core scenario the feature exists to solve. Without it, any accidental exit destroys partially entered workout data, which is the primary user pain point. All other stories depend on the draft existing.

**Independent Test**: Can be fully tested by starting a routine workout, entering weight/rep values for two exercises, closing and reopening the app, and verifying the resume prompt appears with the previously entered values intact.

**Acceptance Scenarios**:

1. **Given** the user is filling out a routine workout form, **When** they navigate away before submitting, **Then** all entered values are preserved as a draft.
2. **Given** a saved draft exists, **When** the user opens the app (including after a page reload), **Then** the Routines tab icon shows a badge and the in-progress routine is visually distinguished in the Routines list. No modal or banner is shown.
3. **Given** the user taps the in-progress routine in the list, **Then** the routine workout form opens with all previously entered field values restored.
4. **Given** the user resumes and then submits the completed form, **Then** the draft is cleared and the workout is logged normally.

---

### User Story 2 — Leave Routine Editor Without Losing Progress (Priority: P1)

While filling out a routine workout, the user decides to check something on the Log tab or elsewhere in the app. They navigate away intentionally and later return to the Routines tab. The app recognises the in-progress draft and lets the user resume seamlessly — no data loss and no forced completion before they can leave.

**Why this priority**: Co-equal with Story 1 because the ability to leave freely depends on the same draft mechanism. Without this, the only safe path is to prevent leaving, which is a worse user experience than losing data.

**Independent Test**: Can be fully tested by starting a routine workout, entering values for at least one exercise, switching to the Log tab, switching back to Routines, and verifying the workout form re-opens with previously entered data intact.

**Acceptance Scenarios**:

1. **Given** the user is filling out a routine workout, **When** they navigate to another section of the app, **Then** they are not blocked or warned — navigation proceeds immediately.
2. **Given** the user navigated away with an in-progress draft, **When** they return to the Routines tab, **Then** the Routines list is shown, the Routines tab icon carries a badge, and the in-progress routine has a badge in the list. The user taps the routine to resume.
3. **Given** the user discards the draft explicitly (see Story 3), **Then** the form is cleared and they are returned to the Routines list.

---

### User Story 3 — Discard an In-Progress Routine Draft (Priority: P2)

A user started a routine workout but changed their mind — they want to start fresh or cancel entirely. The app provides an explicit "Discard" or "Cancel" action in the routine workout editor. After confirming, the draft is cleared and the user returns to the Routines list.

**Why this priority**: Necessary for correctness — without a discard path, an abandoned draft blocks the user from starting a fresh routine workout indefinitely.

**Independent Test**: Can be fully tested by starting a routine workout, entering some values, tapping "Discard", confirming the action, and verifying no resume prompt appears on subsequent app visits.

**Acceptance Scenarios**:

1. **Given** the user is in the routine workout editor, **When** they tap "Discard" (or "Cancel"), **Then** a confirmation prompt appears asking them to confirm the discard.
2. **Given** the confirmation prompt, **When** the user confirms, **Then** the draft is deleted, the form is closed, and the user lands on the Routines list.
3. **Given** the confirmation prompt, **When** the user cancels the discard, **Then** the form remains open with all entered values intact.
4. **Given** no draft exists, **When** the app starts, **Then** no resume prompt is shown and the app loads the normal start screen.

---

### Edge Cases

- What happens if the draft write to the database fails? The draft save fails silently; the user can still continue filling the form but will not be protected against exit. No data is corrupted.
- What if the user starts a new routine workout while a draft from a different routine already exists? The old draft is overwritten with the new session. Only one draft is maintained at a time.
- What if the routine referenced by a draft is deleted? The draft is deleted in the same operation as the routine, so the badge clears immediately and no stale draft remains.
- What if exercises were added to or removed from the routine while a draft is in progress? On resume, the form reflects the current exercise list; saved values are restored for exercises that still exist and new exercises start empty. Values for removed exercises are silently dropped.
- What if the draft data is malformed (e.g., storage was tampered with)? The app detects the invalid draft, discards it silently, and proceeds without the resume prompt.
- What if the user submits the routine workout form successfully? The draft is cleared immediately upon successful submission so the resume prompt does not appear on the next app visit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST automatically save the current state of an in-progress routine workout as a draft whenever the user makes a change to any field in the form.
- **FR-002**: The draft MUST be stored in the same database as all other app data, surviving page reload and browser-tab closure, and persisting until explicitly cleared.
- **FR-003**: When a routine workout draft exists, the system MUST display a badge on the Routines tab icon and a badge on the in-progress routine's entry in the Routines list. No modal, banner, or startup prompt is shown.
- **FR-004**: The system MUST restore all previously entered field values (exercise rows, sets, reps, weights) when the user chooses to continue a draft.
- **FR-005**: Users MUST be able to navigate away from the routine workout editor at any time without being blocked or forced to complete the form.
- **FR-006**: The system MUST provide an explicit "Discard" action within the routine workout editor that clears the draft after user confirmation.
- **FR-007**: The draft MUST be cleared automatically when the user successfully submits the routine workout form.
- **FR-008**: The system MUST handle a missing or malformed draft gracefully — no crash, no resume prompt, normal app start.
- **FR-009**: Only one routine workout draft may be active at a time; starting a new routine session replaces any existing draft.
- **FR-010**: When a routine is deleted, any draft associated with that routine MUST be deleted in the same operation. The Routines tab badge and list badge MUST be cleared immediately.

### Key Entities

- **Routine Workout Draft**: A transient record of an in-progress routine workout session. Contains: the routine identifier and, for each exercise in the routine, the user-entered weight and reps values per set row. The exercise list itself is always re-read from the live routine on resume. There is at most one draft at any given time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users who accidentally navigate away from a routine workout form lose zero previously entered data — all field values are restored on resume.
- **SC-002**: When a draft exists, the badge is visible on the Routines tab icon immediately on app load, without requiring the user to navigate anywhere first.
- **SC-003**: Navigating away from the routine workout editor takes no longer than any other in-app navigation — no confirmation dialog or delay is introduced on exit.
- **SC-004**: The discard flow completes in two taps (discard tap + confirm tap), leaving no draft behind.
- **SC-005**: Zero cases of a stale resume prompt appearing after a routine workout has been successfully submitted.

## Assumptions

- The feature applies exclusively to the routine-based workout entry form (started from the Routines tab "Start" button). The existing ad-hoc "Add Workout" flow on the Log tab is out of scope.
- Only the most recently started routine workout draft is preserved; no history of discarded or prior sessions is required.
- The resume prompt on app start is informational and non-blocking — the user can dismiss it and use the rest of the app without resuming the draft.
- The draft is stored in the app's SQLite database (the same store used for all other app data) — no separate persistence layer is introduced.
- Draft persistence does not need to survive clearing browser site data; that is considered an intentional user action.
- The feature is fully self-contained in the client; no server or sync mechanism is required.
