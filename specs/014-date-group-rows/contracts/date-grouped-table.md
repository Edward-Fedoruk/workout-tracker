# Contract: DateGroupedTable

**Component**: `src/routes/workouts/DateGroupedTable/index.tsx`  
**Type**: Presentational  
**Renders**: The default grouped view — a MUI Table with full-width date-divider rows separating day groups, and per-workout rows with exercise + set data.

---

## Props

```ts
type DateGroupedTableProps = {
  groups: WorkoutDateGroup[];          // pre-grouped rows, newest-first
  onDelete: (id: number) => void;      // triggers delete confirmation in parent
  onEdit: (id: number) => void;        // triggers edit form in parent
};
```

`WorkoutDateGroup` is defined in `src/utils/dateGroup.ts` (see data-model.md).

---

## Visual Structure

```
┌──────────────────────────────────────────────┐
│  ── Today ──────────────────────────────────  │  ← DateDividerRow (full colSpan)
│  Squat           75kg × 5   80kg × 5   …  ⋮  │  ← WorkoutRow
│  Bench Press     60kg × 8   65kg × 5   …  ⋮  │  ← WorkoutRow
│  ── Monday ─────────────────────────────────  │  ← DateDividerRow
│  Deadlift        100kg × 3  …              ⋮  │  ← WorkoutRow
│  ── 3 June ──────────────────────────────────  │  ← DateDividerRow
│  …                                            │
└──────────────────────────────────────────────┘
```

---

## Constraints (spec-derived)

| Constraint | Source | How satisfied |
|-----------|--------|---------------|
| Divider is non-interactive | FR-001a | `<TableRow>` is not clickable; no hover style |
| Divider scrolls with content | FR-001c | No `position: sticky`; normal table flow |
| No date column | FR-005 | Columns: Exercise, Set1–Set5 (no `workout_date` column) |
| Actions column | FR-007 | Edit / delete icons in the last column |
| Mobile-first | Principle VI | Verified at 320px; no fixed pixel widths |
| File size | Principle VIII | ≤200 lines; heavy logic stays in `dateGroupUtils.ts` |

---

## Column Layout

The component renders the same column set as the MRT Advanced view minus the date column:

| Column | Data field | Width hint |
|--------|-----------|------------|
| Exercise | `exercise_name` | flex/auto |
| Set 1 | `Set1_weight`, `Set1_reps` | ~100px |
| Set 2 | `Set2_weight`, `Set2_reps` | ~100px |
| Set 3 | `Set3_weight`, `Set3_reps` | ~100px |
| Set 4 | `Set4_weight`, `Set4_reps` | ~100px |
| Set 5 | `Set5_weight`, `Set5_reps` | ~100px |
| Actions | — | icon-width |

Set cells use the shared `formatSetCell(weight, reps)` from `WorkoutSetRow.tsx`.  
Columns beyond Set 1 that are empty across the entire dataset MAY be omitted for space — implementation detail left to the implementer.

---

## DateDividerRow sub-element

```
<TableRow>
  <TableCell colSpan={totalColumns} sx={{ ... }}>
    <Divider>
      <Typography variant="caption">{group.label}</Typography>
    </Divider>
  </TableCell>
</TableRow>
```

- `colSpan` = number of rendered columns (Exercise + visible set count + Actions)
- Styled as a visual separator, not a heading (`<Typography variant="caption">` or `overline`)
- No click handler, no hover state, no role="button"

---

## What this component does NOT own

- The view-mode toggle control (owned by `WorkoutsView`)
- The Add Workout button (owned by `WorkoutsView`)
- The WorkoutForm / DeleteWorkoutDialog (owned by `WorkoutsView`)
- Date label computation (owned by `dateGroupUtils.ts`)
- Data fetching (owned by `useWorkouts`)
