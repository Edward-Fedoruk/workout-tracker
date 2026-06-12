# Contract: WorkoutRowActions

**Component**: `src/routes/workouts/WorkoutRowActions/index.tsx`  
**Type**: Presentational  
**Replaces**: `src/routes/workouts/WorkoutRowActions.tsx` (flat file → folder per Principle VIII)

---

## Props

```ts
export type WorkoutRowActionsProps = {
  onDelete: () => void;
  onEdit: () => void;
};
```

Props are unchanged from the old component — callers (`GroupedWorkoutTable`, `AdvancedWorkoutTable`) require no prop changes.

---

## Visual Structure

```
┌─────┐
│  ⋮  │  ← MUI IconButton (MoreVertIcon)
└─────┘
    │ (on click)
    ▼
┌──────────┐
│  Edit    │  ← MenuItem → calls onEdit()
│  Delete  │  ← MenuItem → calls onDelete(), styled with error color
└──────────┘
```

---

## Internal State

| State | Type | Description |
|-------|------|-------------|
| `anchorEl` | `null \| HTMLElement` | Anchor for the MUI Menu; null = menu closed |

---

## Behaviour

- Tapping the `MoreVertIcon` button sets `anchorEl` to the button element, opening the menu.
- Selecting "Edit" closes the menu and calls `onEdit()`.
- Selecting "Delete" closes the menu and calls `onDelete()`.
- Clicking the backdrop (`Menu` onClose) clears `anchorEl` without firing any callback.

---

## Constraints

| Constraint | Source | How satisfied |
|------------|--------|---------------|
| No inline Edit/Delete buttons | FR-009 | Replaced entirely by icon + menu |
| Same in both views | FR-009 (clarified) | Single component used by both tables |
| Mobile tap target ≥ 44×44px | Principle VI | MUI IconButton default size meets requirement |
| File size ≤ 200 lines | Principle VIII | Component is ~40 lines |
