# Feature Specification: Exercise eRM Performance Chart

**Feature Branch**: `017-exercise-erm-chart`  
**Created**: 2026-06-15  
**Status**: Draft  
**Input**: User description: "Add a chart for tracking performance on the exercise page. Use mui x charts. Track eRM for each set with a different color on a chart"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View eRM Trend Per Set (Priority: P1)

A user navigates to an exercise's detail page and sees a chart that plots their estimated 1-Rep Max (eRM) over time, with each set number represented as a distinct color series. This gives them an immediate visual sense of whether their strength is improving, plateauing, or declining — broken down by which set within a session the data came from.

**Why this priority**: This is the core value of the feature. Without it, there is no chart and no performance insight.

**Independent Test**: Can be fully tested by navigating to any exercise that has at least two logged workout sessions, and verifying that a chart appears showing eRM values plotted over the workout dates with one colored line per set number.

**Acceptance Scenarios**:

1. **Given** an exercise with logged sets across multiple workout sessions, **When** a user opens the exercise detail page, **Then** a chart is displayed showing eRM values on the Y-axis and workout dates on the X-axis, with each set number (Set 1, Set 2, etc.) rendered as a separate color-coded series.
2. **Given** an exercise that has only been logged in a single session, **When** a user opens the exercise detail page, **Then** the chart displays the data points from that session with appropriate set-color coding, making clear the current baseline.
3. **Given** an exercise where some sessions have 3 sets and others have 2 sets, **When** the chart is rendered, **Then** each set series only plots points for sessions where that set was actually performed — missing sets do not appear as zeroes or gaps that imply failure.
4. **Given** a user viewing the chart, **When** they select "Last Month" from the time-range filter, **Then** the chart immediately updates to show only sessions from the past 30 days, and reverts to the full dataset when "All Time" is selected.

---

### User Story 2 - Understand eRM Calculation (Priority: P2)

A user who is unfamiliar with eRM can understand what the chart metric represents without leaving the page, so they can correctly interpret whether their numbers are meaningful.

**Why this priority**: eRM is a derived metric, not a directly logged value. Users who don't know the formula may misread the chart or distrust it.

**Independent Test**: Can be fully tested by checking that the chart area includes a label, tooltip, or brief descriptor that names the metric "Estimated 1-Rep Max (eRM)" and clarifies it is calculated from logged weight and reps.

**Acceptance Scenarios**:

1. **Given** a user viewing the exercise chart, **When** they hover or tap a data point, **Then** a tooltip shows the date, set number, and eRM value with enough context to understand what the number represents.
2. **Given** a user viewing the exercise chart, **When** they look at the chart title or axis label, **Then** it is clear the Y-axis represents eRM (not raw weight or total volume).

---

### User Story 3 - Graceful Empty State (Priority: P3)

A user who has never logged the exercise, or who has logged it only once with no reps/weight data, sees a clear and helpful empty state instead of a broken or empty chart.

**Why this priority**: Without graceful handling, users on a new install or with sparse data see a confusing blank or errored chart.

**Independent Test**: Can be fully tested by viewing an exercise with zero logged history and confirming the chart area shows a descriptive message rather than rendering a blank chart.

**Acceptance Scenarios**:

1. **Given** an exercise with no workout history, **When** a user opens the exercise detail page, **Then** the chart area shows an empty-state message indicating no data is available yet.
2. **Given** an exercise where all logged sets lack both weight and reps (so eRM cannot be calculated), **When** a user opens the exercise detail page, **Then** the chart area shows a message explaining that eRM requires logged weight and reps.

---

### Edge Cases

- Bodyweight-only sets are fully supported — eRM is pre-computed in the DB using stored body weight; no special handling needed.
- The database enforces a maximum of 5 sets per session (`set_number BETWEEN 1 AND 5`), so the chart will never need to render more than 5 series.
- What happens if all sessions occurred on the same date — does the chart remain readable?
- How does the chart render on a narrow mobile screen where long date labels may overlap?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The exercise detail page MUST display a performance chart when the exercise has at least one logged set with computable eRM.
- **FR-002**: The chart MUST plot eRM values on the vertical axis and workout session dates on the horizontal axis.
- **FR-003**: Each set number (Set 1, Set 2, Set 3, …) MUST be rendered as a visually distinct color series using a line chart with point markers, connecting data points across sessions to show trend direction.
- **FR-004**: The chart MUST read pre-computed eRM values from the database for each set — no on-the-fly calculation is required. All set types, including bodyweight exercises, already have eRM stored.
- **FR-005**: Data points for a given set series MUST only appear for sessions where that set was actually performed — absent sets MUST NOT be plotted as zero.
- **FR-006**: The chart MUST display an informative empty state when no computable eRM data exists for the exercise.
- **FR-007**: Hovering or tapping a data point MUST reveal a tooltip showing at minimum: the session date, the set number, and the eRM value.
- **FR-008**: The chart title or Y-axis label MUST clearly identify the metric as "Estimated 1-Rep Max" (or eRM) so the unit of measurement is unambiguous.
- **FR-009**: The chart legend MUST be visible and map each color to its corresponding set number.
- **FR-010**: The chart MUST provide a time-range filter with exactly three options: **All Time**, **Last Year**, and **Last Month**. The filter controls which sessions' data points are displayed.
- **FR-011**: Changing the time-range filter MUST update the chart immediately without a page reload.
- **FR-012**: If no sessions fall within the selected time range, the chart MUST display an empty state indicating no data exists for that period.

### Key Entities

- **Exercise**: The subject of the detail page; identified by name and optionally muscle group.
- **Workout Session**: A dated event containing one or more logged sets for the exercise.
- **Set**: A single logged effort within a session, defined by set number, weight, and reps.
- **eRM (Estimated 1-Rep Max)**: A derived value calculated per set from weight and reps; the primary metric visualized on the chart.
- **Set Series**: All data points for a given set number across all sessions, rendered as a single color line or scatter series on the chart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with 5+ logged sessions for an exercise can identify their personal eRM trend for each set within 10 seconds of opening the exercise detail page — no additional navigation required.
- **SC-002**: The chart renders correctly for exercises with 1 to 5 distinct set numbers (the database-enforced maximum) without layout breakage on desktop or mobile screen widths.
- **SC-003**: 100% of displayed data points accurately reflect the eRM value computed from the logged weight and reps for that specific set and session.
- **SC-004**: The empty state is displayed in under 1 second when navigating to an exercise with no loggable history, with no visible error or blank area.
- **SC-005**: A first-time user can identify what the chart metric means (eRM, not raw weight) without external help, as confirmed by a clear label or tooltip on every data point.

## Clarifications

### Session 2026-06-15

- Q: What chart visualization type should be used to display eRM over time? → A: Line chart with markers — points connected per set series to show trend direction; individual markers expose data via tooltip.
- Q: Should set series be distinguishable by more than color (e.g., marker shape, line pattern) for accessibility? → A: Color only — no secondary visual differentiator required.
- Q: How should bodyweight-only sets be handled when eRM cannot be computed from weight alone? → A: Not an issue — eRM is already pre-computed and stored in the DB for bodyweight exercises using the user's stored body weight; the chart reads eRM values directly without any special-case logic.
- Q: How much historical data should the chart display by default, and is filtering supported? → A: A time-range filter with three options — All Time, Last Year, Last Month — allowing users to control the data window shown.
- Q: Which time-range filter option should be pre-selected when the page first loads? → A: All Time.

## Assumptions

- eRM is pre-computed and stored in the database for all set types, including bodyweight exercises (which use the user's stored body weight in the Epley formula). The chart reads eRM values directly from the DB — no on-the-fly calculation is needed and no sets are excluded for lacking a weight value.
- The exercise detail page already exists (feature 015); this feature adds the chart as a new section within that page rather than creating a new route.
- MUI X Charts is the chosen charting library. This is noted here as an implementation constraint specified by the product owner, not a business requirement.
- The chart is read-only — users cannot edit data from within it.
- The chart includes a time-range filter with three options: All Time, Last Year, and Last Month. "All Time" is the default selection.
- Set color assignment is stable: Set 1 always maps to the same color, Set 2 to another, etc., so the legend is consistent across page visits.
- Mobile responsiveness is in scope; the chart must be usable on small screens, though it may simplify axis labels to avoid overlap.
