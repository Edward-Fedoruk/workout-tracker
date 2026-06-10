# Phase 0 Research: Combined Workout Set Column

No `NEEDS CLARIFICATION` markers remained after `/speckit.clarify`. This document records the
implementation-shaping decisions for the UI change.

## Decision 1: How to render a value derived from two columns in Material React Table

**Decision**: Use a single column per set with an `accessorFn` that returns the formatted
string, plus a stable `id` (`Set{n}`). The `accessorFn` derives the display value from both
`Set{n}_weight` and `Set{n}_reps` on the row.

**Rationale**: The combined cell is a function of two row fields, not one stored field, so
there is no single `accessorKey` to point at. `accessorFn` is MRT's supported mechanism for a
derived cell value, gives the column a real value (so default sort/copy behave sensibly), and
keeps the formatting in one place. An explicit `id` is required by MRT when `accessorFn` is used.

**Alternatives considered**:
- *Keep `accessorKey: Set{n}_weight` + a `Cell` that reads `row.original.Set{n}_reps`*: works,
  but couples the column identity to the weight field and is less clear than a derived `id`.
- *Pre-compute combined strings in the repository/`WorkoutTableRow`*: rejected — that pushes a
  presentation concern into the data layer and would change the type/query (violates the
  spec's UI-only constraint, FR-004).

## Decision 2: Formatting / partial-value rules (from clarifications)

**Decision**: Implement a pure helper `formatSetCell(weight, reps)`:
- both present → `` `${weight}kg × ${reps}` `` (e.g. `25kg × 10`)
- only weight → `` `${weight}kg` ``
- only reps → `` `${reps}` ``
- neither → `—` (the existing placeholder)

**Rationale**: Encodes the two clarification answers (separator = `×`; partial → show the value
present) in one testable, pure function. Mirrors the existing `renderNullable` placeholder so
empty cells look identical to today.

**Alternatives considered**:
- *Collapse any incomplete set to `—`*: rejected during clarification in favor of showing the
  value that is present.
- *Use letter `x` as separator*: rejected during clarification in favor of `×`.

## Decision 3: Column count and default visibility

**Decision**: Per set, emit **two** columns: the combined `Set{n}` column and the existing
`Set{n}_erm` column (unchanged). Update `HIDDEN_SET_COLUMNS` so Set 2–5 hide via the new keys
(`Set{n}` and `Set{n}_erm`) instead of the removed `Set{n}_weight` / `Set{n}_reps` keys.

**Rationale**: FR-005 keeps eRM as its own column; FR-006 preserves default visibility (Set 1
visible, Sets 2–5 hidden). The visibility map keys must match the new column ids or the hide
will silently stop working.

**Alternatives considered**:
- *Leave `HIDDEN_SET_COLUMNS` keyed on the old `_weight`/`_reps` ids*: rejected — those columns
  no longer exist, so Sets 2–5 would appear by default (regresses FR-006).

## Decision 4: Where the helper lives

**Decision**: Export `formatSetCell` as a pure named export from `WorkoutSetRow.tsx` (the file
that owns set-column rendering). The file shrinks overall (3 columns/set → 2), staying well
under the ~200-line soft limit.

**Rationale**: Constitution Principle VIII allows domain helpers co-located with their use; the
helper is tightly bound to the set columns and small. No new file needed.

**Alternatives considered**:
- *New `workoutSetFormat.ts` util file*: acceptable but unnecessary for one small pure function;
  would add a file without reducing size pressure.
