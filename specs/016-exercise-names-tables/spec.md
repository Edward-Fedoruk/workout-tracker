# Feature Specification: Exercise Names in Tables

**Feature Branch**: `016-exercise-names-tables`  
**Created**: 2026-06-12  
**Status**: Draft  
**Input**: User description: "in the setting of an app add a toggle 'Exercise Names in Tables': this toggle when on should impact all of the simplified view tables and instead of images show exercise names. By default it's off"

## Clarifications

### Session 2026-06-12

- Q: Does "all simplified view tables" mean the Workout Log only, or also other views that show exercise avatars? → A: The toggle applies to the main Workout Log table. The Individual Exercise page log table also shows exercise images but does not need one — remove the image column there unconditionally (always show names, no toggle required).
- Q: When exercise names are shown in the Workout Log, should the first column keep the avatar width (~64px) or expand? → A: Expand to a wider fixed width (~120px); truncate only very long names.
- Q: On the Individual Exercise page log table, should the first column show the exercise name, or be removed entirely? → A: Remove it entirely — no icon, no name. The user already knows which exercise they are on.

### Session 2026-06-15

- Q: What should the Workout Log display during the brief async window before the `exercise_names_in_tables` preference is loaded from the DB? → A: Show images (toggle-off appearance) by default; switch to names once the preference resolves to on.
- Q: Does "immediately" (FR-006/SC-002) mean live rerender while on Settings, or takes effect by next navigation back? → A: Takes effect by next navigation back — DB write on toggle, fresh read when Workout Log mounts. No shared React Context required.
- Q: When a name is truncated with ellipsis in the Workout Log (toggle on), should tapping/hovering reveal the full name? → A: No — truncation with ellipsis only; no tooltip or reveal mechanism.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle on to see exercise names instead of images in Workout Log (Priority: P1)

A user who finds exercise images hard to distinguish at a glance, or who uses the app on a device where images don't load well, wants to see exercise names in the workout log table. They open Settings, turn on "Exercise Names in Tables", and immediately the workout log table shows short exercise names in the first column where avatars previously appeared.

**Why this priority**: This is the core value of the feature — without it nothing else matters.

**Independent Test**: Open Settings, enable the toggle, navigate to the Workout Log — the table must show exercise names in place of the avatar column.

**Acceptance Scenarios**:

1. **Given** the toggle is off, **When** the user views the Workout Log table, **Then** exercise avatar images (or the fallback icon) are shown in the first column.
2. **Given** the toggle is off, **When** the user opens Settings and enables "Exercise Names in Tables", **Then** the toggle persists as on and the Workout Log table immediately shows exercise names instead of avatars.
3. **Given** the toggle is on and exercise name text is short, **When** the user views a row, **Then** the name is fully visible without truncation.
4. **Given** the toggle is on and exercise name text is very long, **When** the user views a row, **Then** the name is truncated with an ellipsis so the table layout is not broken.

---

### User Story 2 - Individual Exercise page log table has no identity column (Priority: P1)

A user viewing a specific exercise's detail page sees a log table of past sets for that exercise. Because the page is already scoped to one exercise, any identity column (avatar or name) is redundant and wastes horizontal space. The table must have no first identity column at all, regardless of the toggle setting.

**Why this priority**: This is a simple removal that improves information density on the exercise detail page — no avatar, no name, just the set data.

**Independent Test**: Navigate to any exercise detail page and view its log table — no identity column (neither avatar nor name) should be present, regardless of the toggle state.

**Acceptance Scenarios**:

1. **Given** the toggle is off, **When** the user views the Individual Exercise page log table, **Then** no identity column (avatar or name) is shown — the table starts directly with the set columns.
2. **Given** the toggle is on, **When** the user views the Individual Exercise page log table, **Then** no identity column is shown (same as when off).

---

### User Story 3 - Preference survives app restarts (Priority: P2)

A user who has enabled "Exercise Names in Tables" closes and reopens the app. Their preference is remembered and the Workout Log table still shows names, not images.

**Why this priority**: Without persistence the setting is useless after a single session.

**Independent Test**: Enable the toggle, reload the app — the toggle must still be on and the Workout Log table must still show names.

**Acceptance Scenarios**:

1. **Given** the toggle is on, **When** the user closes and reopens the app, **Then** the toggle is still on and exercise names are still shown in the Workout Log table.
2. **Given** the toggle is off (default), **When** the user opens the app for the first time, **Then** the toggle is off and images are shown in the Workout Log table.

---

### User Story 4 - Toggle off restores images in Workout Log (Priority: P3)

A user who previously enabled the toggle decides they prefer images again. They open Settings and turn the toggle off. The Workout Log table immediately reverts to showing avatars.

**Why this priority**: Reversibility is a basic UX expectation for any preference toggle.

**Independent Test**: Enable the toggle, navigate away, return to Settings, disable it — the Workout Log table must show images again.

**Acceptance Scenarios**:

1. **Given** the toggle is on, **When** the user disables "Exercise Names in Tables" in Settings, **Then** exercise avatars are shown again in the Workout Log table.

---

### Edge Cases

- What happens when an exercise has no image assigned in the Workout Log (toggle off)? Fallback icon is shown, as before.
- What happens when an exercise name is longer than the column can display (toggle on)? Name is truncated with ellipsis; layout does not break. No tooltip or tap-to-reveal mechanism is provided.
- What happens on first install with no stored preference? Toggle defaults to off and images are shown in the Workout Log.
- Does the toggle state affect the Individual Exercise page? No — that page always omits the identity column entirely, regardless of toggle.
- What does the Workout Log render while the preference is being loaded from the DB? Images (toggle-off appearance) are shown as the initial state; the column switches to names once the async read resolves to on. No loading skeleton is needed for this column.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Settings screen MUST include a toggle labeled "Exercise Names in Tables".
- **FR-002**: The toggle MUST default to off (images shown in Workout Log) when no stored preference exists.
- **FR-003**: When the toggle is on, the Workout Log table MUST display the exercise name in the column where an avatar/image previously appeared.
- **FR-004**: When the toggle is off, the Workout Log table MUST display the exercise avatar (image or fallback icon) as before.
- **FR-005**: The user's preference MUST be persisted across app sessions (stored in the app's existing key-value settings store).
- **FR-006**: Toggling the setting MUST take effect by the time the user navigates back to the Workout Log — no page reload is needed. Live rerender while on the Settings screen is not required.
- **FR-007**: When the toggle is on, the Workout Log name column MUST be wider than the avatar column (~120px fixed width) to accommodate readable name text. Names that still exceed this width MUST be truncated with an ellipsis; the table layout MUST NOT break.
- **FR-008**: The Individual Exercise page log table MUST NOT display any identity column (neither avatar nor name). The table MUST begin directly with the set columns, regardless of the toggle state.

### Key Entities

- **AppSetting (exercise_names_in_tables)**: A boolean preference stored in the existing `app_setting` key-value table. Key: `exercise_names_in_tables`, value: `"true"` or `"false"`. Applies only to the Workout Log table.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate and toggle "Exercise Names in Tables" within Settings in under 10 seconds.
- **SC-002**: After toggling the setting and navigating back to the Workout Log, the table reflects the new preference without requiring a page reload.
- **SC-003**: The preference survives a full app reload 100% of the time once set.
- **SC-004**: Exercise names in Workout Log table rows never cause horizontal overflow or layout breakage regardless of name length.
- **SC-005**: The Individual Exercise page log table shows no identity column (avatar or name) on 100% of visits, regardless of toggle state.

## Assumptions

- "Simplified view tables" scoped by clarification to: (1) the Workout Log (`GroupedWorkoutTable`) — toggle-controlled (avatar ↔ name); (2) the Individual Exercise page log table — identity column removed entirely.
- The Advanced View overlay is not in scope.
- The toggle is a global preference, not per-table.
- The existing `app_setting` key-value store is sufficient to persist this preference; no schema changes are needed beyond adding a new key.
- No visual distinction (e.g., icon, color) is needed beyond the plain exercise name text.
- The name column in the Workout Log expands to ~120px fixed width when names are shown (wider than the 64px avatar column); truncation handles any remaining overflow.
