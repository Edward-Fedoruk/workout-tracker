# Feature Specification: Date Group Rows in Workout Log

**Feature Branch**: `014-date-group-rows`  
**Created**: 2026-06-11  
**Status**: Draft  
**Input**: User description: "I want to replicate pattern of the group, like today yesterday monday and so on and I thinking on this being like lines in the table and remove the date column on table view"

## Clarifications

### Session 2026-06-11

- Q: Should table column sorting be allowed when date dividers are shown? → A: Default view is locked to date order with dividers (no user re-sorting); add a deliberate, well-designed "Advanced view" mode that toggles off grouping and exposes the full table-library capabilities (sorting, filtering, column visibility, etc.).
- Q: While scrolling, should the current day's divider stick to the top (Notes-style) or scroll away? → A: Static — dividers scroll away with the rows like ordinary separator lines; nothing pins to the top.
- Q: How wide is the window where a date is labeled by weekday name vs. a calendar date? → A: Rolling window — weekday name for dates older than yesterday but within the last 6 days; older than that shows a calendar date. Guarantees each weekday name appears at most once.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan the log by relative day grouping (Priority: P1)

A user opens the workout log table and sees their workouts separated into day sections by full-width divider lines. Each divider is a thin separator row spanning the whole table width, carrying a relative label — "Today", "Yesterday", a weekday name for recent days (e.g. "Monday"), and a calendar date for older entries. The divider acts as a visual line between groups of records (the way Notes separates entries by date), not as a column and not as a collapsible header. All workouts performed on the same day appear together between that day's divider line and the next. The user no longer has to read a date on every row to understand when a workout happened.

**Why this priority**: This is the core of the request and delivers the primary value on its own — it makes the log faster to scan and visually matches the familiar Notes-app grouping the user wants to replicate. Even without removing the date column, grouping alone is a usable improvement.

**Independent Test**: Load a log that contains workouts spread across several days (including today, yesterday, earlier this week, and weeks/months ago) and confirm each day appears once as a full-width divider line in the correct relative wording, with that day's workouts listed between it and the next divider in the existing newest-first order.

**Acceptance Scenarios**:

1. **Given** the log contains one or more workouts dated today, **When** the user views the table, **Then** a single full-width divider line labeled "Today" precedes those workouts.
2. **Given** the log contains workouts dated the previous calendar day, **When** the user views the table, **Then** a single full-width divider line labeled "Yesterday" precedes those workouts.
3. **Given** the log contains a workout dated three days ago (within the past week, older than yesterday), **When** the user views the table, **Then** a divider line showing that day's weekday name (e.g. "Monday") precedes it.
4. **Given** the log contains a workout from earlier this year but more than a week ago, **When** the user views the table, **Then** a divider line showing a calendar date without a year (e.g. "3 June") precedes it.
5. **Given** the log contains a workout from a previous year, **When** the user views the table, **Then** a divider line showing a calendar date that includes the year precedes it.
6. **Given** several workouts share the same date, **When** the user views the table, **Then** exactly one divider line for that date separates them from the surrounding days (no duplicate divider lines).

---

### User Story 2 - Remove the redundant date column (Priority: P2)

With each workout's day now conveyed by its divider line, the standalone "Date" column is redundant. The user wants it removed from the table so the remaining columns (exercise, sets) get more room and the table reads cleanly.

**Why this priority**: Depends on Story 1 — the date can only be safely removed once grouping conveys the same information. It is a refinement of the primary value rather than the value itself.

**Independent Test**: After divider lines are in place, confirm the table no longer renders a "Date" column header or per-row date cell, and that no workout's day becomes ambiguous as a result (each row still sits under a dated divider line).

**Acceptance Scenarios**:

1. **Given** grouping headings are displayed, **When** the user views the table, **Then** there is no "Date" column header and no per-row date value.
2. **Given** the date column is removed, **When** the user views any workout row, **Then** the day it belongs to is still unambiguous from the divider line above it.
3. **Given** the user opens a workout to edit it, **When** the edit form is shown, **Then** the workout's exact date is still visible and editable (date information is not lost, only relocated out of the table grid).

---

### User Story 3 - Switch to an Advanced view for full table control (Priority: P3)

The default grouped view is locked to date order so the dividers stay coherent. A power user occasionally wants to sort, filter, or otherwise manipulate the log freely (e.g. sort by exercise, filter to a date range, change which columns show). They toggle an **Advanced view** that turns off date grouping and exposes the full set of table-library capabilities, then can return to the default grouped view at any time.

**Why this priority**: It's a deliberate escape hatch, not the core experience. The grouped default (Stories 1–2) delivers the value; Advanced view serves a smaller power-user need and can ship after the default works. It must be designed thoughtfully so the two modes don't feel like two disjoint tables.

**Independent Test**: With the default grouped view in place, toggle Advanced view and confirm grouping/dividers turn off, the date becomes available for sorting/filtering, and the full table interactions (sort, filter, column visibility) work; then toggle back and confirm the locked grouped view returns unchanged.

**Acceptance Scenarios**:

1. **Given** the default grouped view, **When** the user activates Advanced view, **Then** date dividers are removed, the table becomes a flat list, and column sorting/filtering/visibility controls become available.
2. **Given** Advanced view is active, **When** the user needs to sort or filter by date, **Then** the date is available as a sortable/filterable column (it is reintroduced as a normal column in this mode).
3. **Given** Advanced view is active, **When** the user toggles back to the default view, **Then** date grouping with dividers is restored and the table returns to locked newest-first date order.
4. **Given** the user has switched modes, **When** they reopen the log later, **Then** the view mode is remembered per the chosen persistence behavior (see Assumptions) so they are not surprised by an unexpected mode.
5. **Given** either mode, **When** the user edits, deletes, or adds a workout, **Then** those actions work identically in both modes.

---

### Edge Cases

- **Empty log**: When there are no workouts, no heading rows are shown and the existing empty-table state is preserved.
- **Day boundary while the app is open**: "Today"/"Yesterday" labels are relative to the current date; the spec does not require live re-labeling at midnight, but a normal reload reflects the correct current-day wording.
- **Single day only**: If every workout is from the same day, a single divider line is shown above all rows.
- **Topmost divider**: The first (newest) day's divider line still appears at the top of the list; it is not omitted just because nothing precedes it.
- **Future-dated entry**: If a workout's date is later than today (e.g. a data-entry slip), it is grouped under its calendar date heading rather than "Today"/"Yesterday".
- **Sort consistency**: Headings appear in the same newest-first order the rows already use; within a day, the existing row order is preserved.
- **Locale**: Weekday and month names follow the user's browser/device language and week conventions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workout log table MUST separate workout rows by their workout date, inserting one full-width divider line per distinct date that spans the entire table width and visually delimits that day's records from adjacent days.
- **FR-001a**: The date divider MUST be presented as a separator line (a labeled horizontal rule between record groups), NOT as a table column, a per-row value, or a collapsible/expandable group header. It is non-interactive: it cannot be sorted, edited, or collapsed.
- **FR-001c**: Dividers MUST scroll normally with the rows (static); they MUST NOT stick/pin to the top of the viewport while scrolling.
- **FR-001b**: In the default (grouped) view, user-driven column sorting and reordering MUST be disabled so the date grouping stays coherent; the table stays locked to newest-first date order.
- **FR-002**: Each date heading MUST display a relative label using these rules, in order of precedence: "Today" for the current date; "Yesterday" for the prior calendar day; the weekday name (e.g. "Monday") for dates older than yesterday but within the last 6 days (a rolling window, so each weekday name appears at most once); a day-and-month date without year for older dates within the current calendar year; a day-month-year date for dates in a prior year.
- **FR-003**: All workouts sharing the same date MUST be grouped contiguously and preceded by exactly one divider line for that date, with no duplicate or empty divider lines.
- **FR-004**: Date headings and the groups beneath them MUST be ordered newest-first, consistent with the existing default ordering of the log; the order of rows within a single day MUST be preserved from the existing behavior.
- **FR-005**: The table MUST NOT display a standalone date column or per-row date cell once divider lines are in place; the date is conveyed solely by the divider line above each group.
- **FR-006**: A workout's exact date MUST remain visible and editable when the user opens that workout to edit it, so removing the column does not remove access to the precise date.
- **FR-007**: Existing per-row actions (edit, delete) and the existing add-workout entry point MUST continue to function unchanged within the grouped view.
- **FR-008**: When the log is empty, the view MUST show the existing empty state and no heading rows.
- **FR-009**: Relative date labels MUST be computed against the current date at the time the table is displayed.
- **FR-010**: Weekday and month names in headings MUST respect the user's device language/locale.
- **FR-011**: The log MUST offer two view modes — a **default grouped view** (date dividers, locked date order, no standalone date column) and an **Advanced view** (no dividers, flat list, full table-library controls) — with a clearly discoverable, well-labeled control to switch between them.
- **FR-012**: Activating Advanced view MUST disable date grouping/dividers and enable the table-library's interactive capabilities (at minimum column sorting and filtering; column visibility where supported).
- **FR-013**: In Advanced view, the workout date MUST be available as a normal sortable/filterable column, since the divider no longer conveys it.
- **FR-014**: Switching between the two modes MUST preserve the underlying data and the per-row edit/delete/add actions; only presentation and available interactions change.
- **FR-015**: The selected view mode MUST persist across visits to the log so the user is not unexpectedly returned to the other mode (default mode on first ever use is the grouped view).

### Key Entities *(include if feature involves data)*

- **Workout log entry**: An existing record representing a workout performed on a specific date, with an associated exercise and set data. This feature reads its date to derive grouping; it does not change how the entry is stored.
- **Date divider (derived, display-only)**: A full-width separator line carrying a relative date label, inserted before each group of workout log entries that share the same workout date. It visually delimits one day's records from the next. It is computed for display, is non-interactive, and is not a stored entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of workouts that share a date are preceded by a single, correctly-labeled divider line, with no duplicate divider lines, across a dataset spanning today, yesterday, the past week, earlier this year, and prior years.
- **SC-002**: The standalone date column is absent from the table in 100% of views, while every row remains traceable to the dated divider line above its group.
- **SC-003**: A user can identify which day any given workout belongs to without opening or interacting with the row (verified by observation: the answer is visible from the divider line above it).
- **SC-004**: A workout's exact date remains retrievable and editable via the edit flow in 100% of cases after the column is removed.
- **SC-005**: Edit, delete, and add-workout actions succeed at the same rate as before the change (no regression introduced by grouping), in both the default and Advanced views.
- **SC-006**: A user can switch from the grouped default to Advanced view (and back) in a single, discoverable action, and the chosen mode is still in effect on their next visit to the log.
- **SC-007**: In Advanced view, the user can sort and filter the log — including by date — with the full table controls, none of which are available in the locked default view.

## Assumptions

- The existing newest-first ordering of the workout log (most recent date first) is the desired order for headings and is retained.
- "Recent weekday" labeling applies to dates strictly older than yesterday and within the last 6 days (rolling window), so a given weekday name can never appear twice. Resolved in Clarifications.
- Older dates are shown as a calendar date (day + month, adding the year only when the date is in a prior calendar year) rather than coarse buckets like "Previous 7 Days" / "Previous 30 Days", since the user asked for day-level grouping ("lines in the table"), not period buckets.
- Date labels are localized via the user's browser/device locale; no separate in-app locale setting is introduced.
- Live midnight re-labeling is not required; labels are correct on each load/display, and an open session updating at midnight is out of scope.
- The exact workout date continues to be available in the workout edit form, which already exposes a date field, so no information is lost by removing the column.
- This is a presentation-layer change over existing data; no schema change, migration, or change to how dates are stored is required.
- The grouping is presented as a non-interactive full-width separator line (a labeled horizontal rule), not as a collapsible/expandable group or a sortable column. There is no expand/collapse, and the divider cannot be toggled or hidden in the default view.
- **Advanced view**: assumed to be a single toggle (e.g. a labeled switch/segmented control near the table) that flips between the locked grouped view and a flat, fully-interactive table; the exact control affordance and styling are a planning/design detail. Advanced view reuses the existing table library's built-in sort/filter/column-visibility features rather than introducing bespoke controls.
- **Mode persistence**: assumed to persist the chosen view mode locally so it survives reloads, defaulting to the grouped view on first use. (Persisting it as a lightweight UI preference; if app preferences are stored in the database, this would follow the same single-persistence-layer rule, to be decided in planning.)
