# Data Model: Exercise eRM Performance Chart

## No Schema Changes Required

All data needed for the chart is already stored. The `workout_set.erm` column (nullable real) holds the pre-computed Estimated 1-Rep Max for every logged set. No migration needed.

---

## Existing Entities Used

### `workout_log` table

| Column         | Type    | Notes                            |
|----------------|---------|----------------------------------|
| `id`           | integer | PK                               |
| `workout_date` | text    | ISO date string `YYYY-MM-DD`     |
| `exercise_name`| text    | FK-by-name to `exercise.name`    |

### `workout_set` table

| Column       | Type    | Notes                                         |
|--------------|---------|-----------------------------------------------|
| `id`         | integer | PK                                            |
| `workout_id` | integer | FK → `workout_log.id` (cascade delete)        |
| `set_number` | integer | 1–5 (DB-enforced CHECK constraint)            |
| `reps`       | integer | > 0 (DB-enforced)                             |
| `weight`     | real    | nullable (bodyweight exercises may omit)       |
| `erm`        | real    | nullable; pre-computed Epley eRM at save time |

### Unique constraint: `(workout_id, set_number)` — one row per set per workout.

---

## Runtime Types (no new types needed)

### `WorkoutTableRow` (existing, from `src/db/entities/workout-log/types.ts`)

The repository's `listByExerciseName` returns this pivoted shape. The chart reads directly from it.

```ts
type WorkoutTableRow = {
  id: number;
  workout_date: string;        // 'YYYY-MM-DD'
  exercise_name: string;
  exercise_image_filename: null | string;
  Set1_erm: null | number;
  Set1_reps: null | number;
  Set1_weight: null | number;
  Set2_erm: null | number;
  // ... Set3, Set4, Set5 same shape
  Set5_erm: null | number;
  Set5_reps: null | number;
  Set5_weight: null | number;
};
```

### New derived type — `ErmChartSeries`

Defined locally in `ExerciseErmChart/index.tsx`. Not exported (internal to the component).

```ts
type ErmChartSeries = {
  data: Array<number | null>;   // parallel to xAxis dates array; null = set not performed
  id: string;                   // 'set-1', 'set-2', ...
  label: string;                // 'Set 1', 'Set 2', ...
};
```

### New derived type — `TimeRange`

```ts
type TimeRange = 'all' | 'month' | 'year';
```

Defined in `ExerciseErmChart/index.tsx`. Not exported.

---

## Data Flow

```
workout_set.erm (DB)
  └─► listByExerciseName() → WorkoutTableRow[]
        └─► useExerciseDetail: rawRows state
              └─► ExerciseErmChart props
                    └─► filterByRange(rawRows, timeRange) → filtered WorkoutTableRow[]
                          └─► deriveChartSeries(filteredRows) → { xDates[], series: ErmChartSeries[] }
                                └─► <LineChart xAxis series />
```

---

## Derivation Logic (pseudocode)

```ts
function deriveChartSeries(rows: WorkoutTableRow[]) {
  // rows from DB are newest-first; reverse for chronological chart
  const sorted = [...rows].reverse();
  const xDates = sorted.map(r => r.workout_date);

  const SET_DEFS = [
    { ermKey: 'Set1_erm', id: 'set-1', label: 'Set 1' },
    { ermKey: 'Set2_erm', id: 'set-2', label: 'Set 2' },
    { ermKey: 'Set3_erm', id: 'set-3', label: 'Set 3' },
    { ermKey: 'Set4_erm', id: 'set-4', label: 'Set 4' },
    { ermKey: 'Set5_erm', id: 'set-5', label: 'Set 5' },
  ];

  const series = SET_DEFS
    .map(({ ermKey, id, label }) => ({
      data: sorted.map(r => r[ermKey] ?? null),
      id,
      label,
    }))
    .filter(s => s.data.some(v => v !== null)); // omit sets with no data

  return { series, xDates };
}
```
