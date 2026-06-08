# Data Model: Routine Draft Persistence

## New Entity: `routine_workout_draft`

A singleton table — at most one row exists at any time. Stores the routine identifier and a JSON blob of the user's partially-entered set values.

### Drizzle Schema (`src/db/entities/routine-workout-draft/schema.ts`)

```typescript
import { routine } from '@/db/entities/routine/schema';
import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const routineWorkoutDraft = sqliteTable(
  'routine_workout_draft',
  {
    draftData:  text('draft_data').notNull(),
    id:         integer('id').primaryKey().default(1),
    routineId:  integer('routine_id')
                  .notNull()
                  .references(() => routine.id, { onDelete: 'cascade' }),
    updatedAt:  text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check('singleton_check', sql`${table.id} = 1`),
  ],
);
```

### Columns

| Column | Type | Constraint | Purpose |
|--------|------|-----------|---------|
| `id` | INTEGER | PK, DEFAULT 1, CHECK = 1 | Singleton enforcement |
| `routine_id` | INTEGER | NOT NULL, FK → `routine.id` ON DELETE CASCADE | Ties draft to a specific routine; cascade ensures cleanup on routine delete |
| `draft_data` | TEXT | NOT NULL | JSON-serialized set values (see format below) |
| `updated_at` | TEXT | NOT NULL | ISO timestamp; updated on every upsert |

### `draft_data` JSON Format

```typescript
// Keyed by routineExerciseId (integer as string in JSON)
// null represents an empty/unfilled field (NaN in the form)
type StoredDraftData = Record<string, Array<{ reps: null | number; weight: null | number }>>;
```

Example:
```json
{
  "42": [
    { "reps": 10, "weight": 100 },
    { "reps": 8,  "weight": 95  },
    { "reps": null, "weight": null }
  ],
  "43": [
    { "reps": 12, "weight": null }
  ]
}
```

Keys are `routineExerciseId` values (the `id` column from `routine_exercise`). `null` in JSON maps to `NaN` in the React form (and vice versa on save). Exercises not present in the JSON were not yet touched by the user and default to empty.

### TypeScript Types (`src/db/entities/routine-workout-draft/types.ts`)

```typescript
export type StoredSetValues = Array<{ reps: null | number; weight: null | number }>;
export type StoredDraftData = Record<string, StoredSetValues>;

export type RoutineWorkoutDraft = {
  draftData: StoredDraftData;
  id: 1;
  routineId: number;
  updatedAt: string;
};
```

---

## Existing Entities (unchanged schema, extended behaviour)

### `routine`

No schema change. Deletion cascades to `routine_workout_draft` automatically via the FK constraint.

### `routine_exercise`

No schema change. `id` values are used as keys in `draft_data` JSON to map saved values back to exercises on resume.

---

## Migration

A new Drizzle-generated migration file will be produced by running:

```bash
npx drizzle-kit generate
```

This generates a `.sql` file in `drizzle/` containing:

```sql
CREATE TABLE `routine_workout_draft` (
  `id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
  `routine_id` integer NOT NULL REFERENCES `routine`(`id`) ON DELETE CASCADE,
  `draft_data` text NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CHECK (`id` = 1)
);
```

The migration runner in `src/db/migrations.ts` picks this up automatically on next app start.

---

## Repository Interface (`src/db/entities/routine-workout-draft/repository.ts`)

```typescript
class RoutineWorkoutDraftRepository {
  // Upsert: creates or replaces the singleton draft row.
  async save(routineId: number, data: StoredDraftData): Promise<void>;

  // Returns the current draft, or null if none exists.
  async get(): Promise<null | RoutineWorkoutDraft>;

  // Deletes the draft row (no-op if none exists).
  async clear(): Promise<void>;
}

export const routineWorkoutDraftRepository = new RoutineWorkoutDraftRepository();
```

---

## Database Facade Additions (`src/database.ts`)

Three new exports forwarded from the new repository:

```typescript
export async function saveDraft(routineId: number, data: StoredDraftData): Promise<void>;
export async function getDraft(): Promise<null | RoutineWorkoutDraft>;
export async function clearDraft(): Promise<void>;
```
