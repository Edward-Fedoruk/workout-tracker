# Data Model: Date Group Rows in Workout Log

## Stored Entities

### No schema changes

This feature is a **pure presentation-layer change**. The `workout_log` table schema is unchanged; `workout_date` (stored as `YYYY-MM-DD`) is already the grouping key.

### app_setting — new key (no DDL required)

The existing `app_setting` key-value table gains one new key:

| key | value type | values | default |
|-----|-----------|--------|---------|
| `workout_view_mode` | `text` | `'grouped'` \| `'advanced'` | `'grouped'` (when absent) |

No migration file is needed — this is new data in an already-existing schema.

---

## TypeScript Types (display-only, not stored)

### `WorkoutViewMode`

```ts
// src/db/entities/app-setting/types.ts  (add)
export type WorkoutViewMode = 'advanced' | 'grouped';
```

### `WorkoutDateGroup`

A day group produced by `groupWorkoutsByDate()`. Used by `DateGroupedTable` to render one divider + its rows.

```ts
// src/utils/dateGroup.ts
export type WorkoutDateGroup = {
  isoDate: string;    // 'YYYY-MM-DD' — the grouping key
  label: string;      // localized label e.g. "Today", "Monday", "3 June"
  rows: WorkoutTableRow[];
};
```

### `DateGroupLabel` (internal alias)

The return type of `formatDateGroupLabel(isoDate, now)`. Just `string`, kept as documentation:

```
"Today" | "Yesterday" | weekdayName | "3 June" | "3 June 2024"
```

---

## Pure Utility Functions (`src/utils/dateGroup.ts`)

### `formatDateGroupLabel(isoDate: string, now: Date): string`

Maps an ISO date string to a localized relative label following FR-002:

| Condition | Output example |
|-----------|---------------|
| `isoDate` = today | `"Today"` |
| `isoDate` = yesterday | `"Yesterday"` |
| 1 < delta ≤ 6 days ago | `"Monday"` (weekday name via `Intl`) |
| > 6 days ago, same year | `"3 June"` |
| Prior calendar year | `"3 June 2024"` |
| Future-dated entry | calendar date as above |

**Important**: parse `isoDate` as **local midnight** (`new Date(y, m-1, d)`) — never `new Date('YYYY-MM-DD')` which gives UTC midnight and can return the wrong local day.

### `groupWorkoutsByDate(rows: WorkoutTableRow[], now?: Date): WorkoutDateGroup[]`

Linear O(n) pass over a pre-sorted (`workout_date DESC`) array. Opens a new group whenever `workout_date` changes. Returns groups newest-first, preserving within-day row order. `now` defaults to `new Date()` and is injectable for testing.

---

## Repository Methods (new, `src/db/entities/app-setting/repository.ts`)

```ts
async getWorkoutViewMode(): Promise<WorkoutViewMode>
async setWorkoutViewMode(mode: WorkoutViewMode): Promise<void>
```

Both mirror the existing `getBodyWeight` / `setBodyWeight` pattern exactly. `getWorkoutViewMode` returns `'grouped'` when the key is absent. Both are re-exported from `src/database.ts`.
