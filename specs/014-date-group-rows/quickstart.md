# Quickstart: Date Group Rows in Workout Log

**Branch**: `014-date-group-rows`

## Overview

Five discrete steps. Each step produces a working build.

1. Add `WorkoutViewMode` to `app_setting` repository
2. Add `dateGroup` utilities
3. Build the `DateGroupedTable` presentational component
4. Wire the view-mode toggle into `WorkoutsView`
5. Verify at mobile width

---

## Step 1 — App-setting repository: view mode persistence

**Files**:
- `src/db/entities/app-setting/types.ts` — add `WorkoutViewMode`
- `src/db/entities/app-setting/repository.ts` — add `getWorkoutViewMode`, `setWorkoutViewMode`
- `src/database.ts` — re-export both methods

**Add to `types.ts`**:
```ts
export type WorkoutViewMode = 'advanced' | 'grouped';
```

**Add to `AppSettingRepository`** (mirror the body-weight pattern exactly):
```ts
private readonly VIEW_MODE_KEY = 'workout_view_mode';

async getWorkoutViewMode(): Promise<WorkoutViewMode> {
  const rows = await database
    .select({ value: appSetting.value })
    .from(appSetting)
    .where(eq(appSetting.key, this.VIEW_MODE_KEY));
  const value = rows[0]?.value;
  return value === 'advanced' ? 'advanced' : 'grouped';
}

async setWorkoutViewMode(mode: WorkoutViewMode): Promise<void> {
  await database
    .insert(appSetting)
    .values({ key: this.VIEW_MODE_KEY, value: mode })
    .onConflictDoUpdate({ set: { value: mode }, target: appSetting.key });
}
```

**Re-export from `src/database.ts`**:
```ts
export const getWorkoutViewMode = () => appSettingRepository.getWorkoutViewMode();
export const setWorkoutViewMode = (mode: WorkoutViewMode) =>
  appSettingRepository.setWorkoutViewMode(mode);
```

---

## Step 2 — Date group utilities (`src/utils/dateGroup.ts`)

Create the file. Two exports:

### `formatDateGroupLabel(isoDate: string, now: Date): string`

```ts
export function formatDateGroupLabel(isoDate: string, now: Date): string {
  // Parse as LOCAL midnight to avoid UTC-offset shift
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const delta = Math.round(
    (todayStart.getTime() - date.getTime()) / 86_400_000,
  );

  if (delta === 0) return 'Today';
  if (delta === 1) return 'Yesterday';
  if (delta > 1 && delta <= 6) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
```

### `groupWorkoutsByDate(rows: WorkoutTableRow[], now = new Date()): WorkoutDateGroup[]`

```ts
export function groupWorkoutsByDate(
  rows: WorkoutTableRow[],
  now = new Date(),
): WorkoutDateGroup[] {
  const groups: WorkoutDateGroup[] = [];
  let current: WorkoutDateGroup | null = null;

  for (const row of rows) {
    if (current === null || current.isoDate !== row.workout_date) {
      current = {
        isoDate: row.workout_date,
        label: formatDateGroupLabel(row.workout_date, now),
        rows: [],
      };
      groups.push(current);
    }
    current.rows.push(row);
  }

  return groups;
}
```

**`WorkoutDateGroup` type** (same file):
```ts
import { type WorkoutTableRow } from '@/database';

export type WorkoutDateGroup = {
  isoDate: string;
  label: string;
  rows: WorkoutTableRow[];
};
```

---

## Step 3 — `DateGroupedTable` component

**File**: `src/routes/workouts/DateGroupedTable/index.tsx`

Key points:
- `Table` from MUI — not `MaterialReactTable`
- One `<TableRow>` with `colSpan` for the divider, one `<TableRow>` per workout
- Use `formatSetCell` from `@/routes/workouts/WorkoutSetRow`
- Use `WorkoutRowActions` for the edit/delete icons
- Columns: Exercise, Set1–Set5, Actions (no `workout_date`)

```tsx
import { type WorkoutDateGroup } from '@/utils/dateGroup';
import { formatSetCell } from '@/routes/workouts/WorkoutSetRow';
import { WorkoutRowActions } from '@/routes/workouts/WorkoutRowActions';
import {
  Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';

type Props = {
  groups: WorkoutDateGroup[];
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
};

const SET_NUMBERS = [1, 2, 3, 4, 5] as const;
const TOTAL_COLUMNS = 1 + SET_NUMBERS.length + 1; // Exercise + Sets + Actions

export const DateGroupedTable = ({ groups, onDelete, onEdit }: Props) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Exercise</TableCell>
          {SET_NUMBERS.map((n) => <TableCell key={n}>Set {n}</TableCell>)}
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {groups.map((group) => (
          <>
            <TableRow key={`divider-${group.isoDate}`}>
              <TableCell colSpan={TOTAL_COLUMNS} sx={{ py: 0.5 }}>
                <Divider>
                  <Typography variant="overline">{group.label}</Typography>
                </Divider>
              </TableCell>
            </TableRow>
            {group.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.exercise_name}</TableCell>
                {SET_NUMBERS.map((n) => (
                  <TableCell key={n}>
                    {formatSetCell(row[`Set${n}_weight`], row[`Set${n}_reps`])}
                  </TableCell>
                ))}
                <TableCell>
                  <WorkoutRowActions
                    onDelete={() => onDelete(row.id)}
                    onEdit={() => onEdit(row.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
```

---

## Step 4 — Wire mode toggle into `WorkoutsView` + `useWorkouts`

### `useWorkouts.ts` additions

```ts
// Load view mode on mount (alongside existing refresh())
const [viewMode, setViewModeState] = useState<WorkoutViewMode>('grouped');

// In refresh():
const [rows, exerciseList, bw, mode] = await Promise.all([
  listWorkouts(), listExercises(), getBodyWeight(), getWorkoutViewMode(),
]);
setViewModeState(mode);

const setViewMode = async (mode: WorkoutViewMode) => {
  await setWorkoutViewMode(mode);
  setViewModeState(mode);
};

// Add to return object: viewMode, setViewMode
```

### `WorkoutsView.tsx` — toggle control + conditional render

```tsx
// In renderTopToolbarCustomActions (MRT Advanced view) or a shared toolbar Box:
<ToggleButtonGroup
  exclusive
  onChange={(_, v) => v !== null && setViewMode(v)}
  size="small"
  value={viewMode}
>
  <ToggleButton sx={{ minHeight: 44 }} value="grouped">Grouped</ToggleButton>
  <ToggleButton sx={{ minHeight: 44 }} value="advanced">Advanced</ToggleButton>
</ToggleButtonGroup>

// Conditional render:
{viewMode === 'grouped' ? (
  <DateGroupedTable
    groups={groupWorkoutsByDate(workouts)}
    onDelete={requestDelete}
    onEdit={(id) => { openEdit(id).catch(() => undefined); }}
  />
) : (
  <MaterialReactTable table={table} />
)}
```

In Advanced view, **add back** the `workout_date` column to the MRT columns array and enable sorting/filtering (remove `enableSorting: false`).

---

## Step 5 — Verify

```bash
npm run dev
```

1. Open workout log. Confirm: divider rows appear, no Date column, newest day first.
2. Open DevTools → resize to 320px. Confirm: no horizontal scroll, dividers span full width.
3. Toggle Advanced view. Confirm: MRT appears with Date column and sort/filter controls.
4. Toggle back to Grouped. Confirm: dividers return.
5. Reload page. Confirm: last-selected mode is restored.
6. Edit a workout. Confirm: date field visible and editable in the form.
7. Delete a workout. Confirm: row removed, divider disappears if it was the last of its day.

```bash
npm run build && npm run preview
```

8. PWA offline check: install, go offline, reload — grouped view still works.

---

## Lint + typecheck before committing

```bash
npm run lint && npm run typecheck
```

Both must pass. The repo stop-hook enforces this before commits.
