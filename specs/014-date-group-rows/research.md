# Phase 0 Research: Date Group Rows

All Technical Context unknowns are resolved below. There were no `NEEDS CLARIFICATION`
items left after `/speckit.clarify`; the open implementation choices are decided here.

## R1 — How to render static, non-collapsible, full-width divider rows

**Decision**: Render the default grouped view as a **dedicated presentational component**
(`GroupedWorkoutLog/index.tsx`), not via MaterialReactTable's grouping. It emits, in
order, a styled full-width divider element before each day's group, then that day's rows.

**Rationale**:
- The spec forbids the divider being a column, a per-row value, or a collapsible/expandable
  group header (FR-001a) and requires it to be static, not sticky (FR-001c).
- MRT's native grouping (`enableGrouping`) produces **collapsible** group rows anchored to
  a grouping column — directly at odds with FR-001a, and styling it into a plain rule fights
  the library.
- The default view is fully **locked** (no sort/filter/paginate per FR-001b), so the heavy
  MRT feature set buys nothing here; a simple component is both simpler and a better fit.

**Alternatives considered**:
- *MRT grouping, expansion disabled, styled as a line* — rejected: brittle CSS against
  library internals, still semantically a group header, risk of regressions on MRT upgrades.
- *Inject synthetic "divider" rows into the MRT data array with a full-span cell* — rejected:
  MRT/TanStack has no first-class column-spanning body row; would require per-cell hacks and
  breaks the typed `WorkoutTableRow` row model.

## R2 — Default vs Advanced view: one table or two render paths

**Decision**: **Two render paths behind a mode switch.** Default = `GroupedWorkoutLog`
(custom). Advanced = the **existing MaterialReactTable** (current `WorkoutsView` body),
with the date column **retained** and sorting/filtering/column-visibility enabled.
`WorkoutsView.tsx` becomes a thin switch that renders one or the other plus the toggle.

**Rationale**:
- Advanced view's purpose is "all possible things React table allows" (FR-012); reusing the
  existing MRT delivers that for free and avoids re-implementing sort/filter/visibility.
- Default view's purpose is the locked, divider-separated reading experience; a custom
  component satisfies it cleanly.
- Keeps each component focused and <200 lines (Principle VIII) and preserves the
  container/presentational split (Principle VII).

**Accepted trade-off**: Row/set-cell rendering exists in two places (MRT columns vs the
grouped component). Mitigated by sharing the already-exported pure `formatSetCell` and a
shared set-visibility rule (see R5). This duplication is intentional and bounded.

**Alternatives considered**:
- *Single MRT instance toggling flags/grouping* — rejected for the FR-001a reasons in R1 and
  because the "off" state still carries MRT's grouping machinery.

## R3 — Relative date label algorithm

**Decision**: A pure function `formatDateGroupLabel(isoDate: string, now: Date): string`
in `src/utils/dateGroup.ts`, applying, in precedence order (per FR-002, clarified):
1. `isoDate` is today → `"Today"`
2. `isoDate` is yesterday → `"Yesterday"`
3. older than yesterday **and within the last 6 days** → localized weekday name
   (rolling window, so a weekday name never repeats)
4. older, but same calendar year as `now` → day + month, no year (e.g. `"3 June"`)
5. prior calendar year → day + month + year (e.g. `"3 June 2025"`)

**Rationale**: Matches the clarified spec exactly; injecting `now` keeps the function pure
and trivially verifiable. Locale comes from the runtime via `Intl`/`toLocaleDateString`
(FR-010) with no app-level locale setting.

**Key implementation note (date parsing)**: `workout_date` is an ISO `YYYY-MM-DD` string
(confirmed: it is compared lexically against `getToday()` and ordered with `ORDER BY
workout_date DESC`). Parsing `new Date('YYYY-MM-DD')` yields **UTC midnight**, which can be
the wrong local day. Therefore compute day differences on **calendar dates in local time**:
parse the `YYYY-MM-DD` parts into a local `Date(y, m-1, d)` (or compare date-only strings)
rather than relying on UTC parsing. "Today"/"Yesterday" are derived from `now`'s local date.

**Alternatives considered**:
- *Pull in `date-fns`/`dayjs`* — rejected: no date library is currently a dependency; the
  logic is small and `Intl` covers localization. Avoids dependency growth (Principle V).

## R4 — Grouping the already-ordered rows

**Decision**: A pure `groupWorkoutsByDate(rows: WorkoutTableRow[]): WorkoutDateGroup[]`
in `src/utils/dateGroup.ts`. Because `listWorkouts()` already returns rows ordered
`workout_date DESC, id DESC`, grouping is a single linear pass that starts a new group each
time `workout_date` changes — preserving newest-first order across groups and the existing
order within a group (FR-003, FR-004). Each group carries `{ isoDate, label, rows }`.

**Rationale**: O(n), no re-sorting, deterministic, and label is computed once per group.

## R5 — Which set columns/cells to show in the grouped view

**Decision**: Reuse the existing data-driven visibility intent. The grouped component renders
the same set cells the MRT view shows, using the exported `formatSetCell`. The "hide empty
ERM sub-columns" behavior (`HIDDEN_SET_COLUMNS`) is presentation config; the grouped view
will mirror the same visible-set logic via a small shared helper rather than duplicating the
rule inline.

**Rationale**: Single source of truth for "what a set cell looks like"; avoids drift between
the two views.

## R6 — View-mode persistence location

**Decision**: Persist as a row in the existing `app_setting` table under key
`workout_view_mode` with value `'grouped' | 'advanced'`, via two new methods on
`AppSettingRepository` (`getWorkoutViewMode`, `setWorkoutViewMode`) mirroring
`getBodyWeight`/`setBodyWeight`. Re-exported through `src/database.ts`. Default when absent
or unrecognized: `'grouped'` (FR-015).

**Rationale**:
- Principle I forbids a second persistence layer (no `localStorage`) for app data; the
  `app_setting` table is the sanctioned store and already used for the body-weight preference.
- **No migration needed**: `app_setting` already exists; this is a new key (data), not DDL
  (Principle III is satisfied without `drizzle-kit generate`).
- Parameterized via Drizzle `onConflictDoUpdate` (Principle IV), identical to the existing
  upsert pattern.

**Alternatives considered**:
- *localStorage / sessionStorage* — rejected (Principle I).
- *In-memory only (no persistence)* — rejected: FR-015 requires the mode to survive visits.

## R7 — Toggle control affordance

**Decision**: A single, clearly-labeled control in the table's top toolbar area (alongside
the existing "Add Workout" action) — e.g. a labeled segmented control / switch reading
"Grouped" vs "Advanced". Touch target ≥44×44px (Principle VI), verified at 320px width.

**Rationale**: Discoverable (SC-006), single-action switch, lives where users already look
for log-level actions. Exact MUI component (ToggleButtonGroup vs Switch) is a small UI choice
left to implementation; both satisfy the contract.

## Resolved unknowns summary

| Unknown | Resolution |
|---|---|
| Divider rendering mechanism | Custom presentational component (R1) |
| One vs two views | Two paths; Advanced reuses MRT (R2) |
| Label algorithm + date parsing | Pure util, local-date math, `Intl` locale (R3) |
| Grouping | Linear pass over pre-ordered rows (R4) |
| Set cell reuse | Shared `formatSetCell` + visibility helper (R5) |
| Persistence | `app_setting` key, no migration (R6) |
| Toggle UI | Labeled toolbar control, ≥44px (R7) |
