# Contract: GroupedWorkoutTable

**Component**: `src/routes/workouts/GroupedWorkoutTable/index.tsx`  
**Type**: Presentational  
**Renders**: The default grouped view — date-divider rows separating day groups, per-workout rows with exercise image + compact set data + three-dot action menu.

---

## Props

```ts
type Props = {
  groups: WorkoutDateGroup[];
  onAdvanced: () => void;         // ← NEW: opens advanced view
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
};
```

`onAdvanced` is new — previously the "Advanced" button lived above the table in `WorkoutsView`; it now lives in the actions column header.

---

## Visual Structure

```
┌────┬──────┬──────┬──────┬──────┬──────┬───────────────┐
│ 🖼 │  ①  │  ②  │  ③  │  ④  │  ⑤  │  [Advanced]   │  ← header (icons green)
├────┴──────┴──────┴──────┴──────┴──────┴───────────────┤
│  ────────────── Today ────────────────────────────────  │  ← date divider
├────┬──────┬──────┬──────┬──────┬──────┬───────────────┤
│ 🏋 │ 80×5 │ 85×3 │  —   │  —   │  —   │      ⋮       │  ← workout row
│ 🧍 │ ×12  │ ×10  │  —   │  —   │  —   │      ⋮       │
├────┴──────┴──────┴──────┴──────┴──────┴───────────────┤
│  ─────────────── Monday ──────────────────────────────  │
├────┬──────┬──────┬──────┬──────┬──────┬───────────────┤
│ 🏋 │100×3 │  —   │  —   │  —   │  —   │      ⋮       │
└────┴──────┴──────┴──────┴──────┴──────┴───────────────┘
```

---

## Column Layout

| Column | Header | Content | Width |
|--------|--------|---------|-------|
| Exercise | (none — image only) | `<img>` or placeholder icon | 48px (fixed) |
| Set 1 | `LooksOneIcon` (secondary color) | `weight×reps` or `×reps` or `weight` | auto |
| Set 2 | `LooksTwoIcon` (secondary color) | same format | auto |
| Set 3 | `Looks3Icon` (secondary color) | same format | auto |
| Set 4 | `Looks4Icon` (secondary color) | same format | auto |
| Set 5 | `Looks5Icon` (secondary color) | same format | auto |
| Actions | `<Button>Advanced</Button>` | `<WorkoutRowActions>` | auto |

---

## Set Cell Style

| Property | Value |
|----------|-------|
| Font size | 12px |
| Horizontal padding | 10px (left and right) |
| Format | `weight×reps` — no "kg", no spaces around "×" |

---

## Constraints

| Constraint | Source | How satisfied |
|------------|--------|---------------|
| No text "Set N" headers | FR-001 | Icon components only |
| Icons green | FR-001 | `color="secondary"` prop |
| Exercise image in column | FR-003, FR-004 | `<img>` 40×40px; column width 48px fixed |
| No image → placeholder | FR-003 | `FitnessCenterIcon` at same size |
| No "kg" in set cells | FR-005 | `formatSetCell` updated |
| 12px font, 10px H-padding | FR-006, FR-007 | `sx` on `TableCell` |
| Advanced in header | FR-008 | `<Button size="small">` in last `<TableCell>` of `<TableHead>` |
| Three-dot menu in rows | FR-009, FR-010 | `<WorkoutRowActions>` component |
| Mobile ≥ 320px | Principle VI | No fixed widths except exercise image column |
