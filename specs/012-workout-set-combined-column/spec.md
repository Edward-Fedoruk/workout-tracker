# Feature Specification: Combined Workout Set Column (weight × reps)

**Feature Branch**: `012-workout-set-combined-column`  
**Created**: 2026-06-10  
**Status**: Draft  
**Input**: User description: "in current workout table we now display reps and kgs as seperate columns. But I want it to be displayed as 25kg x 10 in one column. I want to format it on ui like that. no db change needed"

## Clarifications

### Session 2026-06-10

- Q: How should a set cell render when only one of weight/reps is recorded? → A: Show whichever value is present (only weight → `25kg`; only reps → `10`); show `—` only when both are missing.
- Q: Which separator glyph should appear between weight and reps? → A: `×` (multiplication sign), rendering as `25kg × 10`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a set's weight and reps at a glance (Priority: P1)

A person reviewing their workout history opens the workout table. For each set, instead of scanning two separate columns (one for weight, one for reps) they see a single column that combines both values in a compact, readable form such as `25kg × 10`. This makes each logged set faster to read and frees up horizontal space in the table.

**Why this priority**: This is the entire feature. Combining the two columns into one readable cell is the only user-facing outcome requested.

**Independent Test**: Open the workout table with at least one logged set that has both a weight and reps recorded, and confirm the set is shown as a single combined column (e.g. `25kg × 10`) rather than as separate weight and reps columns.

**Acceptance Scenarios**:

1. **Given** a logged set with weight 25 and reps 10, **When** the user views the workout table, **Then** that set appears in a single column showing `25kg × 10` (one combined cell), and no separate stand‑alone weight and reps columns are shown for that set.
2. **Given** multiple sets logged for the same workout entry (e.g. Set 1 and Set 2), **When** the user views the table, **Then** each set has its own combined column (e.g. `S1`, `S2`) each showing its own `weight × reps` value.
3. **Given** the existing estimated‑rep‑max (eRM) information for a set, **When** the user views the table, **Then** that information continues to be displayed as it was before (it is not merged into the combined column).

---

### Edge Cases

- **Set with no data**: When a set has neither weight nor reps recorded for a workout row, the combined column shows the existing empty placeholder (`—`) rather than a malformed value like `—kg × —`.
- **Weight present, reps missing (or vice versa)**: When only one of the two values exists, the cell shows the value that is present alone — `25kg` when only weight exists, or `10` when only reps exist — without the `×` separator. The full `weight × reps` form is shown only when both values are present.
- **Bodyweight / zero weight**: When a set is recorded with a weight of 0 (e.g. bodyweight movement), the cell shows `0kg × <reps>` consistent with the stored value.
- **Decimal weights**: When weight is a non‑integer (e.g. 22.5), the value is shown as stored (`22.5kg × 10`).
- **Hidden sets**: Sets that are hidden by default today (Set 2–5) remain hidden by default; their combined columns follow the same default visibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workout table MUST present each set's weight and reps together in a single column instead of two separate columns.
- **FR-002**: When both weight and reps are recorded, the combined value MUST be formatted as `<weight>kg × <reps>` using the `×` (multiplication sign) separator (for example, `25kg × 10`).
- **FR-003**: When only one of weight or reps is recorded, the combined column MUST display the value that is present alone, without the `×` separator (only weight → `<weight>kg`; only reps → `<reps>`).
- **FR-003a**: When a set has neither weight nor reps recorded, the combined column MUST display the existing empty placeholder (`—`).
- **FR-004**: The change MUST be presentation‑only — no stored data is altered, added, or migrated; the underlying weight and reps values remain unchanged.
- **FR-005**: The estimated‑rep‑max (eRM) display for each set MUST remain available and unchanged by this feature.
- **FR-006**: The default visibility of sets (which sets are shown vs. hidden initially) MUST be preserved after the columns are combined.
- **FR-007**: Each set column header MUST clearly identify which set it represents (e.g. `S1`, `S2`).

### Key Entities *(include if feature involves data)*

- **Workout Set (display only)**: Represents one logged set within a workout row, characterized by its weight, its reps, and its estimated rep max. This feature changes only how the weight and reps are rendered together; it does not change the entity's stored attributes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every set that has both a weight and reps, the workout table shows exactly one combined cell per set in the `<weight>kg × <reps>` form, and zero separate weight‑only or reps‑only columns for that set.
- **SC-002**: A user can identify both the weight and reps of a logged set by reading a single cell, with no need to cross‑reference a second column.
- **SC-003**: No data values are changed — the weight and reps shown in the combined cell match the previously stored values for every existing workout row.
- **SC-004**: The number of columns required to display the same set information is reduced (two columns → one) for each visible set.

## Assumptions

- "kgs" refers to the weight value already stored per set; the unit label shown is `kg`. No unit conversion or user‑configurable units are in scope.
- The order is weight first, then reps (`25kg × 10`), matching the user's example.
- The eRM column remains a separate column and is not folded into the combined cell.
- This is a UI‑only change; no database schema or persisted data changes are required, per the user's instruction.
