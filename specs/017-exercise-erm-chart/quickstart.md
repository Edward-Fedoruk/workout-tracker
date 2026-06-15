# Quickstart: Exercise eRM Performance Chart

## What's Being Built

A line chart on the existing `ExerciseDetail` page showing Estimated 1-Rep Max (eRM) over time, with one color-coded line per set number (Set 1–5). Includes a three-option time-range filter (All Time / Last Year / Last Month).

## Prerequisites

- Active branch: `017-exercise-erm-chart`
- Node 18+, `npm install` already run
- `@mui/x-charts` is **not yet installed** — Step 1 covers this

## Step 1 — Install MUI X Charts

```bash
npm install @mui/x-charts
```

Verify in `package.json` that `@mui/x-charts` appears under `dependencies`. No Vite config changes needed (it has no worker/WASM concerns).

## Step 2 — Expose raw rows from `useExerciseDetail`

**File**: `src/routes/exercises/Exercise/ExerciseDetail/hooks/useExerciseDetail.ts`

Add `rawRows` state alongside the existing `groups` state:

```ts
const [rawRows, setRawRows] = useState<WorkoutTableRow[]>([]);
```

In `loadHistory`, populate both:

```ts
const loadHistory = async (exerciseName: string) => {
  const rows = await listWorkoutsByExerciseName(exerciseName);
  setRawRows(rows);                       // ← add this
  setGroups(groupWorkoutsByDate(rows));
};
```

Add `rawRows` and `WorkoutTableRow` to the return object and imports.

## Step 3 — Create `ExerciseErmChart` component

**New file**: `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseErmChart/index.tsx`

Structure:
- Props: `rows: WorkoutTableRow[]`
- Internal state: `timeRange: TimeRange` (default `'all'`)
- Derives: `xDates` and `series` from filtered+sorted rows
- Renders: filter toggle buttons + `<LineChart>` from `@mui/x-charts`, or empty-state `<Typography>` when no data

Key imports:
```ts
import { LineChart } from '@mui/x-charts/LineChart';
import { type WorkoutTableRow } from '@/database';
```

Empty state condition: `series.length === 0` after filtering.

## Step 4 — Wire into `ExerciseDetailView`

**File**: `src/routes/exercises/Exercise/ExerciseDetail/views/ExerciseDetailView.tsx`

Import `ExerciseErmChart` and render it above the history section divider (or between the header and the history table). Pass `rawRows` from props:

```tsx
<ExerciseErmChart rows={rawRows} />
```

Add `rawRows` to the destructured props from `UseExerciseDetailReturn`.

## Step 5 — Verify

```bash
npm run dev
```

1. Navigate to an exercise with workout history.
2. Confirm chart renders with colored lines per set.
3. Switch filter to "Last Month" — chart updates immediately.
4. Navigate to an exercise with no history — confirm empty-state message, no crash.
5. Check mobile viewport (375px width) — chart must not overflow.

```bash
npm run typecheck && npm run lint
```

Both must pass before committing.

## File Summary

| File | Action |
|------|--------|
| `package.json` | Add `@mui/x-charts` dependency |
| `useExerciseDetail.ts` | Add `rawRows` state + populate in `loadHistory` |
| `ExerciseErmChart/index.tsx` | **New** — chart component with time-range filter |
| `ExerciseDetailView.tsx` | Add `<ExerciseErmChart rows={rawRows} />` |
