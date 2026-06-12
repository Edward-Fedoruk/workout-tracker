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

### Session 2026-06-12

- Q: Should the simplified view strip all MRT-style chrome (filter, sort, search bar, column visibility, pagination toolbar) — just a bare table with date groups? → A: Yes — simplified view is a plain table with date-grouped rows and no interactive table controls whatsoever.
- Q: Should the two views be implemented as two separate React components so the simplified one can be reused elsewhere? → A: Yes — two separate components. The simplified `GroupedWorkoutTable` is standalone and reusable; the Advanced view is a separate component wrapping MaterialReactTable.
- Q: Where does the "Open Advanced view" control live — inside the simplified component or in the parent? → A: In the parent/container (outside the simplified component), so `GroupedWorkoutTable` stays unaware of the Advanced concept and is cleanly reusable.
- Q: How does Advanced view open — inline toggle or full-screen? → A: Full-screen (opens as a full-screen overlay/modal). The control is a toggle/button rendered by the parent.

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

### User Story 3 - Open the Advanced view for full table control (Priority: P3)

The default grouped view is intentionally minimal — no sort controls, no filter bar, no search, no column visibility picker. A power user occasionally wants to sort, filter, or otherwise manipulate the log freely (e.g. sort by exercise, filter to a date range, change which columns show). They tap an **"Advanced"** button (rendered by the page, outside the grouped table) and the Advanced view opens **full-screen** as an overlay, presenting a fully-interactive MaterialReactTable. They can dismiss it to return to the default grouped view.

**Why this priority**: It's a deliberate escape hatch, not the core experience. The grouped default (Stories 1–2) delivers the value; Advanced view serves a smaller power-user need. It must be designed thoughtfully so the two modes feel coherent.

**Independent Test**: With the default grouped view visible, tap the Advanced button and confirm the view opens full-screen, grouping/dividers are gone, the date is available as a column, and the full MRT interactions (sort, filter, column visibility) work. Dismiss Advanced view and confirm the grouped view is restored.

**Acceptance Scenarios**:

1. **Given** the default grouped view, **When** the user taps the "Advanced" button, **Then** the Advanced view opens full-screen as an overlay, date dividers are gone, the table is a flat list, and MRT sorting/filtering/column-visibility controls are available.
2. **Given** the Advanced view is open full-screen, **When** the user needs to sort or filter by date, **Then** the date is available as a sortable/filterable column.
3. **Given** the Advanced view is open, **When** the user dismisses it (e.g. taps a close/back control), **Then** the full-screen overlay closes and the default grouped view is restored underneath.
4. **Given** the user has opened and closed Advanced view, **When** they reopen the log later, **Then** the default grouped view is shown (Advanced view does not persist open across sessions).
5. **Given** either view, **When** the user edits, deletes, or adds a workout, **Then** those actions work identically in both views.

---

### Edge Cases

- **Empty log**: When there are no workouts, no heading rows are shown and the existing empty-table state is preserved.
- **Day boundary while the app is open**: "Today"/"Yesterday" labels are relative to the current date; the spec does not require live re-labeling at midnight, but a normal reload reflects the correct current-day wording.
- **Single day only**: If every workout is from the same day, a single divider line is shown above all rows.
- **Topmost divider**: The first (newest) day's divider line still appears at the top of the list; it is not omitted just because nothing precedes it.
- **Future-dated entry**: If a workout's date is later than today (e.g. a data-entry slip), it is grouped under its calendar date heading rather than "Today"/"Yesterday".
- **Sort consistency**: Headings appear in the same newest-first order the rows already use; within a day, the existing row order is preserved.
- **Locale**: Weekday and month names follow the user's browser/device language and week conventions.
- **Advanced view on small screens**: The full-screen overlay must fill the viewport on mobile (≥320px) with scrollable MRT content; no horizontal overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workout log table MUST separate workout rows by their workout date, inserting one full-width divider line per distinct date that spans the entire table width and visually delimits that day's records from adjacent days.
- **FR-001a**: The date divider MUST be presented as a separator line (a labeled horizontal rule between record groups), NOT as a table column, a per-row value, or a collapsible/expandable group header. It is non-interactive: it cannot be sorted, edited, or collapsed.
- **FR-001b**: The default (grouped) view MUST contain NO interactive table controls — no sort controls, no filter bar, no search input, no column visibility picker, no pagination toolbar. The table is a plain, locked, read-style view; the only interactive elements are the per-row edit/delete actions and the "Advanced" button in the page container.
- **FR-001c**: Dividers MUST scroll normally with the rows (static); they MUST NOT stick/pin to the top of the viewport while scrolling.
- **FR-002**: Each date heading MUST display a relative label using these rules, in order of precedence: "Today" for the current date; "Yesterday" for the prior calendar day; the weekday name (e.g. "Monday") for dates older than yesterday but within the last 6 days (a rolling window, so each weekday name appears at most once); a day-and-month date without year for older dates within the current calendar year; a day-month-year date for dates in a prior year.
- **FR-003**: All workouts sharing the same date MUST be grouped contiguously and preceded by exactly one divider line for that date, with no duplicate or empty divider lines.
- **FR-004**: Date headings and the groups beneath them MUST be ordered newest-first, consistent with the existing default ordering of the log; the order of rows within a single day MUST be preserved from the existing behavior.
- **FR-005**: The table MUST NOT display a standalone date column or per-row date cell once divider lines are in place; the date is conveyed solely by the divider line above each group.
- **FR-006**: A workout's exact date MUST remain visible and editable when the user opens that workout to edit it, so removing the column does not remove access to the precise date.
- **FR-007**: Existing per-row actions (edit, delete) and the existing add-workout entry point MUST continue to function unchanged within the grouped view.
- **FR-008**: When the log is empty, the view MUST show the existing empty state and no heading rows.
- **FR-009**: Relative date labels MUST be computed against the current date at the time the table is displayed.
- **FR-010**: Weekday and month names in headings MUST respect the user's device language/locale.
- **FR-011**: The log page MUST offer access to an **Advanced view** via a clearly discoverable button or control rendered by the page container (outside the grouped table component). Tapping it opens the Advanced view full-screen as an overlay.
- **FR-012**: The Advanced view MUST open full-screen (covering the full viewport) as an overlay, presenting a fully-interactive MaterialReactTable with date grouping/dividers off, the date available as a normal column, and all MRT interactive capabilities enabled (at minimum: column sorting, filtering, column visibility).
- **FR-013**: In Advanced view, the workout date MUST be available as a normal sortable/filterable column, since the divider no longer conveys it.
- **FR-014**: Switching between the two views MUST preserve the underlying data and the per-row edit/delete/add actions; only presentation and available interactions change.
- **FR-015**: The Advanced view does NOT persist open across sessions; on the next visit the user always sees the default grouped view.
- **FR-016**: The grouped table MUST be implemented as a self-contained, reusable React component (`GroupedWorkoutTable`) that accepts workout data and row-action callbacks as props. It MUST have no knowledge of the Advanced view, no MRT dependency, and no toolbar chrome of any kind.
- **FR-017**: The Advanced view MUST be implemented as a separate React component (`AdvancedWorkoutTable`) wrapping MaterialReactTable, rendered by the page container inside a full-screen overlay when the Advanced button is toggled on.

### Key Entities *(include if feature involves data)*

- **Workout log entry**: An existing record representing a workout performed on a specific date, with an associated exercise and set data. This feature reads its date to derive grouping; it does not change how the entry is stored.
- **Date divider (derived, display-only)**: A full-width separator line carrying a relative date label, inserted before each group of workout log entries that share the same workout date. It visually delimits one day's records from the next. It is computed for display, is non-interactive, and is not a stored entity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of workouts that share a date are preceded by a single, correctly-labeled divider line, with no duplicate divider lines, across a dataset spanning today, yesterday, the past week, earlier this year, and prior years.
- **SC-002**: The standalone date column is absent from the `GroupedWorkoutTable` in 100% of views, while every row remains traceable to the dated divider line above its group.
- **SC-003**: A user can identify which day any given workout belongs to without opening or interacting with the row (verified by observation: the answer is visible from the divider line above it).
- **SC-004**: A workout's exact date remains retrievable and editable via the edit flow in 100% of cases after the column is removed.
- **SC-005**: Edit, delete, and add-workout actions succeed at the same rate as before the change (no regression introduced by grouping), in both the default and Advanced views.
- **SC-006**: A user can open the Advanced view full-screen in a single tap of the "Advanced" button, and can dismiss it to return to the grouped view in a single action.
- **SC-007**: In the Advanced view, the user can sort and filter the log — including by date — with the full MRT controls; none of those controls are present in the grouped view.
- **SC-008**: `GroupedWorkoutTable` renders correctly when embedded in a context other than the Workouts page (verified by passing arbitrary `WorkoutTableRow[]` data and action callbacks — no import of Advanced-view or page-specific state is required).

## Assumptions

- The existing newest-first ordering of the workout log (most recent date first) is the desired order for headings and is retained.
- "Recent weekday" labeling applies to dates strictly older than yesterday and within the last 6 days (rolling window), so a given weekday name can never appear twice. Resolved in Clarifications.
- Older dates are shown as a calendar date (day + month, adding the year only when the date is in a prior calendar year) rather than coarse buckets like "Previous 7 Days" / "Previous 30 Days", since the user asked for day-level grouping ("lines in the table"), not period buckets.
- Date labels are localized via the user's browser/device locale; no separate in-app locale setting is introduced.
- Live midnight re-labeling is not required; labels are correct on each load/display, and an open session updating at midnight is out of scope.
- The exact workout date continues to be available in the workout edit form, which already exposes a date field, so no information is lost by removing the column.
- This is a presentation-layer change over existing data; no schema change, migration, or change to how dates are stored is required.
- **Advanced view persistence**: Advanced view does not persist open across sessions. The page always opens in the grouped view. (No view-mode preference needs to be stored.)
- **Component boundary**: `GroupedWorkoutTable` is MRT-free. `AdvancedWorkoutTable` owns the MRT instance. The page container (`Workouts`) owns the overlay state (open/closed) and renders whichever component is appropriate.
- **Full-screen overlay**: implemented as a MUI `Dialog` with `fullScreen` prop, or equivalent, so it fills the viewport on all screen sizes including mobile.
