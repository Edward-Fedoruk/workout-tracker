# UI Contract: GroupedWorkoutTable

**Component**: `src/routes/workouts/GroupedWorkoutTable/index.tsx`  
**Type**: Presentational

## Props (updated)

```ts
type FirstColumn = 'avatar' | 'name' | 'none';

type Props = {
  readonly groups: WorkoutDateGroup[];
  readonly onEdit?: (id: number) => void;
  readonly firstColumn: FirstColumn;   // NEW — required
};
```

## Behaviour

| `firstColumn` | First column content | Column width |
|---------------|---------------------|--------------|
| `'avatar'` | Avatar (56×56 px image or `FitnessCenterIcon` fallback) | 64 px |
| `'name'` | Exercise name text, truncated with ellipsis | 120 px |
| `'none'` | No first column — table begins directly with set columns | — |

- Mode change is immediate (controlled by prop).
- No animation required.
- All other columns (set icons + set data) are unchanged in all modes.
- Header row first cell: empty in `'avatar'` and `'name'` modes; absent in `'none'` mode.

## Call-sites

| Location | Value passed | Reason |
|----------|-------------|--------|
| `WorkoutsView` (main Workout Log) | `firstColumn={exerciseNamesInTables ? 'name' : 'avatar'}` | toggle-controlled |
| `ExerciseDetailView` (Exercise Detail page) | `firstColumn="none"` | user already knows the exercise |
