# Feature Specification: Exercise Analytics

**Feature Branch**: `019-exercise-analytics`  
**Created**: 2026-06-19  
**Status**: Draft  
**Input**: User description: "implement analytics tab under exercises page. page should include full exercises analytics: muscle group evaluation for week/month/year with a wind rose graph; a week-to-week overall strength progress graph using a formula that captures whether the user is stronger than the previous week even when different exercises improved, surfaced as a percentage statement on the home screen; and a customizable line chart where the user can pick any exercise and any per-set/aggregate parameter (set reps, set eRM, overall eRM, set weight) — multiple parameters at once — rendered mobile-friendly to maximize the use of screen space."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customizable Exercise Parameter Chart (Priority: P1)

A user opens the Analytics tab, selects an exercise, then picks one or more parameters they care about — for example "Set 1 reps", "Set 2 eRM", "Overall eRM", or "Set 3 weight" — and sees those parameters plotted together over time as a multi-series line chart. They can compare how reps, weight, and eRM for specific sets have evolved across their training history, all on one screen.

**Why this priority**: This is the most flexible, self-contained slice of the analytics tab. It gives any user with logged history immediate, configurable insight without depending on the other two analytics. It is the natural extension of the existing per-exercise eRM chart and delivers a working MVP on its own.

**Independent Test**: Can be fully tested by opening the Analytics tab, selecting an exercise with at least two logged sessions, choosing a single parameter (e.g. "Set 1 weight"), confirming a line appears over time, then adding a second parameter and confirming a second distinct series is overlaid.

**Acceptance Scenarios**:

1. **Given** an exercise with logged sets across multiple sessions, **When** the user selects that exercise and one parameter, **Then** a line chart is displayed with workout dates on the horizontal axis and the selected parameter's value on the vertical axis.
2. **Given** a chart showing one parameter, **When** the user adds a second parameter, **Then** a second color-coded series is overlaid on the same chart and the legend updates to identify both series.
3. **Given** the available parameters, **When** the user opens the parameter selector, **Then** they can choose per-set metrics (reps, weight, and eRM for each of Set 1 through Set 5) and aggregate metrics (overall eRM across all sets in a session).
4. **Given** a selected parameter that only applies to some sessions (e.g. "Set 4 reps" when most sessions had 3 sets), **When** the chart renders, **Then** that series only plots points for sessions where the data exists — missing values are not drawn as zero.
5. **Given** the chart is viewed on a narrow mobile screen, **When** it renders, **Then** it uses the full available width, remains readable, and does not overflow the viewport horizontally.
6. **Given** the user has selected parameters, **When** they switch to a different exercise, **Then** the chart updates to that exercise's data and resets or re-validates the parameter selection to what is available.

---

### User Story 2 - Week-to-Week Overall Strength Progress (Priority: P2)

A user wants to know, at a glance, whether they are getting stronger overall — not for one lift, but across everything they trained. The Analytics tab shows a graph of a single weekly "overall strength" score across recent weeks, and the home screen shows a headline statement such as "This week you are 6% stronger than last week" (or weaker), so the user gets the signal without opening analytics.

**Why this priority**: This is the marquee motivational insight, but it depends on a derived scoring formula and a home-screen surface, making it more complex than the direct per-exercise chart. It delivers high engagement value once US1 establishes the analytics foundation.

**Independent Test**: Can be fully tested by logging workouts in two consecutive weeks where some exercises improve and others regress, then confirming the analytics graph plots a score point per week and the home screen displays a stronger/weaker percentage that reflects the combined change rather than any single exercise.

**Acceptance Scenarios**:

1. **Given** the user has logged workouts across two or more weeks, **When** they view the strength-progress graph in the Analytics tab, **Then** a line chart shows one overall-strength score per week over time.
2. **Given** in the current week the user improved on some exercises and regressed on others (e.g. leg press down slightly but bench press up sharply), **When** the overall score is computed, **Then** the score reflects the aggregate change so an overall net improvement is shown as progress.
3. **Given** a completed comparison between the current week and the previous week, **When** the user opens the home screen, **Then** a clearly styled indicator states whether they are stronger or weaker and by what percentage.
4. **Given** the user is stronger this week, **When** the home-screen indicator renders, **Then** it visually signals positive progress (e.g. an upward direction / positive treatment); when weaker, it signals the opposite.
5. **Given** the user has logged data in the current week but has no comparable data in the previous week, **When** the home-screen indicator renders, **Then** it shows a neutral/insufficient-data message instead of a misleading percentage.

---

### User Story 3 - Muscle Group Balance Wind Rose (Priority: P3)

A user wants to see how their training is distributed across muscle groups, to spot imbalances (e.g. lots of chest, little back). The Analytics tab shows a wind-rose (radar/polar) graph with one spoke per muscle group, and a selector to view the distribution over the last week, month, or year.

**Why this priority**: This is a valuable balance-check, but it is a distribution view rather than a progress measure, and it is the least dependent on the other analytics. It rounds out the tab after the two progress-focused stories.

**Independent Test**: Can be fully tested by logging sets for exercises spanning at least two different muscle groups within the selected period, then opening the wind rose and confirming each trained muscle group appears as a spoke sized by its training contribution, and that switching week/month/year changes the values.

**Acceptance Scenarios**:

1. **Given** the user has logged sets for exercises mapped to multiple muscle groups, **When** they view the wind rose, **Then** each muscle group is represented as a spoke whose magnitude reflects how much that muscle group was trained in the selected period.
2. **Given** the period selector, **When** the user chooses Week, Month, or Year, **Then** the wind rose recomputes and updates to reflect only sessions within that period.
3. **Given** an exercise mapped to more than one muscle group, **When** its sets are counted, **Then** that exercise's contribution is attributed to each of its muscle groups.
4. **Given** the muscle groups have assigned colors, **When** the wind rose renders, **Then** it uses those colors consistently so groups are identifiable.
5. **Given** no sets were logged in the selected period, **When** the wind rose renders, **Then** it shows an empty-state message rather than a blank or broken chart.

---

### Edge Cases

- An exercise with no logged history selected in the customizable chart MUST show an empty state, not a broken chart.
- A parameter selected that has no data for the chosen exercise (e.g. "Set 5 eRM" when the user never did 5 sets) MUST result in no series / an empty-state hint rather than a flat zero line.
- The database enforces a maximum of 5 sets per session, so per-set parameters never exceed Set 1–Set 5.
- Bodyweight exercises store a computed eRM using the user's body weight, so eRM-based parameters and scores work for them without special handling; however, "weight" parameters for bodyweight sets may be null and MUST be handled gracefully.
- Weeks with only a single session, or with an exercise performed in one week but not the comparison week, MUST be handled so the strength-progress score is not skewed or undefined.
- A brand-new user with no history MUST see graceful empty states across the whole Analytics tab and a neutral home-screen indicator.
- When all sessions in a period fall on the same date or the same week, charts MUST remain readable.
- Very long muscle-group or exercise names MUST not break chart layout on mobile.

## Requirements *(mandatory)*

### Functional Requirements

#### Analytics tab (shared)

- **FR-001**: The system MUST provide an Analytics tab/section accessible from the Exercises area of the app.
- **FR-002**: Every analytics view MUST render a clear empty state when there is no data to display, with no visible error or blank chart.
- **FR-003**: All analytics charts MUST be mobile-friendly: they MUST use the full available width, remain readable on small screens, and MUST NOT cause horizontal overflow of the page.

#### Customizable exercise parameter chart (US1)

- **FR-004**: The user MUST be able to select an exercise to analyze from their list of exercises.
- **FR-005**: The user MUST be able to select one or more parameters to plot, including per-set reps, per-set weight, and per-set eRM for each set number (Set 1–Set 5), and an aggregate "overall eRM" parameter defined as the **average** of a session's per-set eRM values (mean across the sets in that session).
- **FR-006**: Selected parameters MUST be grouped by unit type and rendered as a **separate line chart per type** — one for reps, one for weight, and one for eRM (up to three charts) — so each unit plots at its own true scale rather than sharing an axis. The aggregate "overall eRM" parameter belongs to the eRM chart. Only charts whose type has at least one selected parameter are rendered.
- **FR-007**: Within each rendered chart, every selected parameter of that type MUST appear as a distinct, color-coded series plotted over workout session dates on a shared date axis, connecting points to show trend direction.
- **FR-008**: A series MUST only plot points for sessions where that parameter's underlying data exists; absent values MUST NOT be rendered as zero.
- **FR-009**: Each rendered chart MUST show a visible legend mapping each color to its parameter, and tapping/hovering a point MUST reveal at least the date, parameter, and value.
- **FR-010**: Changing the selected exercise or parameter set MUST update the chart(s) immediately without a page reload, and parameter choices MUST be re-validated against the newly selected exercise.
- **FR-022**: The US1 view MUST provide a time-range filter with three options — **All Time**, **Last Year**, and **Last Month** (matching the existing per-exercise eRM chart) — defaulting to All Time and applied to all rendered US1 charts together; changing it MUST update the charts immediately.

#### Week-to-week strength progress (US2)

- **FR-011**: The system MUST compute a single "overall strength" score per week as the **sum, across all exercises the user trained that week, of that exercise's best-set eRM for the week** (the highest eRM among the exercise's logged sets in that week).
- **FR-012**: The week-over-week change MUST be the percentage difference between the current week's summed score and the previous week's summed score, so that gains on some exercises and losses on others combine into one overall total (a net improvement reads as progress even if individual lifts moved in different directions).
- **FR-013**: The Analytics tab MUST display the weekly overall-strength score as a line chart over time, showing **all weeks with data** — one point per rolling 7-day week from the first logged workout through the current week.
- **FR-014**: The system MUST compute the percentage change between the current week's score and the previous comparable week's score.
- **FR-015**: The home screen MUST display a headline indicator stating whether the user is stronger or weaker than the previous week and by what percentage, styled per Material design practices, with a clear positive/negative visual treatment.
- **FR-016**: When there is insufficient comparable data to compute a meaningful week-over-week change, the home-screen indicator and the graph MUST show a neutral/insufficient-data state rather than a misleading number.

#### Muscle group wind rose (US3)

- **FR-017**: The Analytics tab MUST display a wind-rose (radar/polar) chart with one spoke per muscle group that was trained in the selected period.
- **FR-018**: Each spoke's magnitude MUST be the muscle group's **training volume** in the period — the sum of (weight × reps) across all sets of all exercises mapped to that group, using the user's stored body weight in place of weight for bodyweight sets so they still contribute.
- **FR-019**: An exercise mapped to multiple muscle groups MUST contribute to each of those muscle groups.
- **FR-020**: The wind rose MUST provide a period selector with three options — Week, Month, and Year — implemented as rolling windows ending today (last 7 / 30 / 365 days) — and MUST recompute immediately when the selection changes.
- **FR-021**: The wind rose MUST use each muscle group's assigned color for its representation where the chart type allows.
- **FR-023**: When fewer than three muscle groups were trained in the selected period, the wind rose MUST still render as a radar chart with the available 1–2 spokes (no fallback to a different chart type); only the empty-period case (no trained groups) shows the empty state.

### Key Entities *(include if feature involves data)*

- **Exercise**: A movement the user trains; identified by name and classification (standard or bodyweight), mapped to one or more muscle groups.
- **Muscle Group**: A trained body region with a name and an assigned color; related to exercises many-to-many.
- **Workout Session (Workout Log)**: A dated record of an exercise being performed; contains one or more sets.
- **Set (Workout Set)**: A single logged effort within a session, with a set number (1–5), reps, optional weight, and a pre-computed eRM.
- **eRM (Estimated 1-Rep Max)**: A per-set derived strength value pre-computed and stored for every set, including bodyweight sets; the basis for eRM-based parameters and the strength score.
- **Parameter**: A user-selectable plottable metric in the customizable chart — a per-set value (reps/weight/eRM for a given set number) or an aggregate (overall eRM).
- **Weekly Strength Score**: A derived per-week aggregate value summarizing the user's overall strength across all exercises trained that week.
- **Period**: A selectable time window (Week / Month / Year) scoping the muscle-group wind rose.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can select an exercise and at least two parameters and see them plotted (in the appropriate per-unit chart(s)) in under 15 seconds from opening the Analytics tab.
- **SC-002**: The customizable view renders correctly with 1 through at least 5 simultaneously selected parameters — across up to three per-unit charts — without layout breakage on mobile or desktop widths.
- **SC-003**: In a scenario where the user nets an overall strength improvement despite a decline in one exercise, the strength-progress score and home-screen indicator both report progress (stronger), not regression.
- **SC-004**: The home-screen strength indicator is visible without scrolling on a typical mobile home screen and communicates direction (stronger/weaker) and magnitude (percentage) at a glance.
- **SC-005**: Switching the wind-rose period among Week/Month/Year updates the displayed distribution within 1 second and the proportions visibly change when the underlying data differs across periods.
- **SC-006**: 100% of charts display a clear empty state (rather than an error or blank area) when no qualifying data exists for the current selection.
- **SC-007**: No analytics chart causes horizontal page overflow on a 360px-wide viewport.

## Clarifications

### Session 2026-06-19

- Q: How should the weekly overall-strength score and the week-over-week % be computed? → A: Sum of best-set eRMs — each week's score is the sum, across all exercises trained that week, of that exercise's best-set eRM; the week-over-week % compares the two weekly totals.
- Q: What time-window semantics should week / month / year use (strength weeks and wind-rose periods)? → A: Rolling windows ending today (last 7 / 30 / 365 days); "this week vs last week" = last 7 days vs the 7 days before.
- Q: What should each wind-rose spoke magnitude measure per muscle group? → A: Training volume — sum of (weight × reps) across all sets of all exercises mapped to the group, with the user's stored body weight substituted for bodyweight sets.
- Q: How should the "Overall eRM" aggregate parameter combine a session's sets? → A: Average set eRM (mean of the session's per-set eRM values).
- Q: How should US1 parameters of different units be grouped into charts? → A: One chart per parameter type — reps, weight, and eRM each render as a separate stacked line chart (up to three), so each unit plots at its own true scale rather than sharing an axis.
- Q: Should the US1 customizable chart(s) have a time-range filter? → A: Yes — the same All Time / Last Year / Last Month toggle as the existing per-exercise eRM chart, applied to all rendered US1 charts together; default All Time.
- Q: How many weeks should the weekly strength-progress chart show by default? → A: All weeks with data — every rolling 7-day week from the first logged workout through the current week.
- Q: How should the wind rose render when fewer than 3 muscle groups were trained in the period? → A: Render the radar anyway (no fallback chart), even with 1–2 spokes.

## Assumptions

- The Analytics tab lives within the existing Exercises area of the app and reuses the existing exercise, muscle-group, workout-log, and workout-set data; no new logged data is introduced.
- eRM is already pre-computed and stored for every set (including bodyweight sets, which use the user's stored body weight), so all eRM-based metrics and scores read stored values rather than recomputing.
- **Strength-score formula (US2)** — resolved in Clarifications: each week's overall-strength score is the sum, across all exercises trained that week, of that exercise's best-set eRM for the week; the week-over-week percentage compares the current week's total to the previous week's total. Because it sums totals, an exercise logged in only one of the two weeks still contributes to that week's total (it is not excluded). A side effect is that logging more distinct exercises raises the weekly total; this is accepted for the first version.
- **Time windows** — resolved in Clarifications: week / month / year are rolling windows ending today (last 7 / 30 / 365 days). "This week vs last week" compares the last 7 days to the 7 days immediately before them. This applies to both the strength-progress weeks and the wind-rose periods.
- **Wind-rose contribution metric (US3)** — resolved in Clarifications: a muscle group's spoke magnitude is its training volume in the period — the sum of (weight × reps) across all sets of all exercises mapped to that group — with the user's stored body weight used in place of weight for bodyweight sets.
- **"Overall eRM" parameter (US1)** — resolved in Clarifications: for a session it is the average (mean) of that session's per-set eRM values.
- The charts are read-only; users cannot edit logged data from analytics.
- Color assignment for parameter series in the customizable chart is stable within a session so the legend stays consistent.
- Mobile responsiveness is a hard requirement for all analytics views.
