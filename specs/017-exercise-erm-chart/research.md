# Research: Exercise eRM Performance Chart

## MUI X Charts — LineChart with Multiple Sparse Series

**Decision**: Use `@mui/x-charts` `LineChart` with a union date array on the X-axis and per-set `data` arrays containing `null` for sessions where that set was not performed.

**Rationale**: MUI X Charts v7/v8 `LineChart` accepts `xAxis[0].data` as a shared array of x-values and `series[i].data` as a parallel value array. Setting a position to `null` skips that point without connecting it (default `connectNulls: false`). This cleanly handles the sparse-data requirement (Set 3 may not exist in all sessions).

**Alternatives considered**:
- Recharts / Victory / Chart.js — ruled out; project already uses MUI, and MUI X Charts keeps the design system consistent.
- Dataset + `dataKey` API — valid MUI X Charts alternative, but the union-array approach is simpler when data must be pre-filtered and sorted in JS anyway.

---

## Data Already Available — No New DB Query Needed

**Decision**: Reuse the data already returned by `listWorkoutsByExerciseName` (stored as `WorkoutTableRow[]`). The repository's `listByExerciseName` already pivots `erm` values into `Set1_erm … Set5_erm` columns alongside `workout_date`.

**Rationale**: All the chart needs is `{ workout_date, Set1_erm, …, Set5_erm }` per session. That's exactly what `WorkoutTableRow` provides. Adding a dedicated chart query would be redundant.

**Change required**: `useExerciseDetail` currently only exposes `groups: WorkoutDateGroup[]`. The raw `WorkoutTableRow[]` must also be stored in state (populated in the same `loadHistory` call) so the chart component can receive it.

---

## Time-Range Filter — Client-side Slice

**Decision**: Filter rows client-side in the chart component using ISO date string comparison against a computed cutoff.

**Rationale**: The full exercise history is already in memory after `listWorkoutsByExerciseName` resolves. An additional DB query per filter change would add latency with no benefit. ISO date strings sort lexicographically, so `row.workout_date >= cutoffISO` works without parsing.

**Filter cutoffs**:
- **All Time**: no filter — use all rows.
- **Last Year**: cutoff = today minus 365 days (approximate; uses `new Date(y-1, m, d)`).
- **Last Month**: cutoff = today minus ~30 days (uses `new Date(y, m-1, d)`).

---

## Set Number Bounds

**Decision**: Chart supports sets 1–5 (the DB-enforced range). At most 5 series.

**Rationale**: `workout_set.set_number` has a `CHECK (set_number BETWEEN 1 AND 5)` constraint. The pivot columns in `WorkoutTableRow` cover exactly this range. No dynamic series count needed.

---

## Component Placement

**Decision**: New `ExerciseErmChart/index.tsx` under `ExerciseDetail/views/`. Time-range filter state lives inside this component (purely a display concern, not shared).

**Rationale**: Follows Principle VIII (folder-per-component, `index.tsx` entry point). Keeps `useExerciseDetail` lean — it only needs to expose `rawRows: WorkoutTableRow[]` alongside the existing `groups`.

---

## MUI X Charts Installation

**Decision**: Add `@mui/x-charts` as a production dependency.

**Rationale**: Not currently in `package.json`. MUI X Charts peer-depends on `@mui/material` and `@emotion/react`, both already installed. Version `^7` aligns with the MUI v6/v7 stack in use.

**Note**: MUI versions: `@mui/material@^9.0.1` is installed, so we need `@mui/x-charts` compatible with MUI v9. Check release notes — MUI X Charts v8 targets MUI v6+; v8 is compatible.
