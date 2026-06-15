# UI Contract: ExerciseErmChart

This document defines the component interface and behavioral contract for the `ExerciseErmChart` component.

## Component

**Path**: `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseErmChart/index.tsx`  
**Type**: Presentational (no DB access, no side effects)  
**Exported name**: `ExerciseErmChart`

---

## Props

```ts
type ExerciseErmChartProps = {
  readonly rows: WorkoutTableRow[];
  // All workout rows for this exercise, sorted newest-first (as returned by listWorkoutsByExerciseName).
  // The component reverses them internally for chronological chart display.
};
```

`WorkoutTableRow` is imported from `@/database`.

---

## Internal State

| State variable | Type        | Default | Description                         |
|----------------|-------------|---------|-------------------------------------|
| `timeRange`    | `TimeRange` | `'all'` | Currently selected time-range filter |

```ts
type TimeRange = 'all' | 'year' | 'month';
```

---

## Behavior Contract

### Time-range filter

| Filter label | Included sessions |
|---|---|
| All Time | All rows in `props.rows` |
| Last Year | Rows where `workout_date >= (today − 1 year)` |
| Last Month | Rows where `workout_date >= (today − 1 month)` |

Cutoff comparison uses ISO date string lexicographic ordering (`YYYY-MM-DD`). Filter changes are synchronous — no DB calls.

### Series derivation

- Rows are reversed to chronological order before processing.
- One series is created per set number (1–5) that has at least one non-null eRM value in the filtered rows.
- Series with zero non-null points are omitted from the chart entirely.
- `null` eRM values within a series produce a gap (no line segment between surrounding points).

### Chart rendering

- Chart type: line with point markers.
- X-axis: workout dates (ISO strings), rendered as a band/category axis.
- Y-axis: eRM value (kg or lb — unit label matches whatever was stored; the component does not convert units).
- Legend: visible, mapping color to "Set N" label.
- Tooltip: shown on hover/tap per data point; displays date, set label, and eRM value.

### Empty state

Rendered when `series.length === 0` after filtering:

| Condition | Message |
|---|---|
| `props.rows` is empty | "No workout history yet." |
| Rows exist but none have eRM in range | "No data for this period." |

### Responsiveness

- Chart container uses `width: '100%'` and a fixed `height` (e.g., 260px).
- X-axis label rotation is delegated to MUI X Charts auto-behavior at narrow widths.
- The filter toggle group wraps on very narrow screens rather than overflowing.

---

## Integration Point

`ExerciseDetailView` renders this component between the exercise info header and the history divider:

```tsx
// ExerciseDetailView.tsx
<ExerciseErmChart rows={rawRows} />
```

`rawRows: WorkoutTableRow[]` is sourced from `useExerciseDetail`, which populates it alongside the existing `groups` state in `loadHistory`.
