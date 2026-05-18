# Data Model: Workout Log Table

**Feature**: Workout Log Table  
**Phase**: Phase 1 (Design)  
**Date**: 2026-05-18

## Entities

### 1. Workout (workout_log table)

**Purpose**: Represents a single exercise session with metadata.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier for each workout |
| `workout_date` | DATE | NOT NULL, `≤ TODAY` | Date workout occurred (no future dates); ISO format (YYYY-MM-DD) |
| `exercise_name` | TEXT | NOT NULL | Name of the exercise (e.g., "Bench Press", "Squats"); user-entered string |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the record was created in the app |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the record was last modified |

**Validations**:
- `workout_date` cannot be in the future (enforced at DB level via CHECK constraint)
- `exercise_name` is required and non-empty (enforced in form + DB NOT NULL)
- Exactly 1 to 5 sets per workout (enforced at application level; DB has CASCADE delete)

**Lifecycle**:
1. User creates entry → DB inserts record with `created_at` = now
2. User adds sets → Sets linked to `workout_id`
3. User edits exercise/date → `updated_at` updated
4. User deletes → Record + all associated sets deleted (CASCADE)

---

### 2. Set (workout_set table)

**Purpose**: Represents a single set within a workout (weight + reps for one interval).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier for each set |
| `workout_id` | INTEGER | NOT NULL, FOREIGN KEY → `workout_log(id)` ON DELETE CASCADE | Links set to its parent workout |
| `set_number` | INTEGER | NOT NULL, CHECK (1–5), UNIQUE(workout_id, set_number) | Order within workout; 1–5 only; prevents duplicates per workout |
| `weight` | REAL | NOT NULL, CHECK (> 0) | Weight lifted in kilograms; positive number required |
| `reps` | INTEGER | NOT NULL, CHECK (> 0) | Number of repetitions; positive integer required |

**Validations**:
- `weight > 0` (enforced at DB level; form validates positive number)
- `reps > 0` (enforced at DB level; form validates positive integer)
- `set_number` ∈ {1, 2, 3, 4, 5} (enforced at DB level + form UI prevents >5)
- No duplicate `set_number` for same `workout_id` (enforced via UNIQUE constraint)

**Lifecycle**:
1. User adds a set to form → Inserted with `set_number` = next available (1–5)
2. User edits set → Weight and/or reps updated
3. User deletes set → Record deleted; remaining sets re-numbered (application logic)
4. User deletes workout → All sets deleted via CASCADE

---

## Relationships

```
Workout (1) ──────── (Many) Set
  id                 workout_id (FK)
                    
Example:
Workout { id: 42, date: 2026-05-18, exercise: "Bench Press" }
  ├─ Set { id: 101, workout_id: 42, set_number: 1, weight: 60.0, reps: 10 }
  ├─ Set { id: 102, workout_id: 42, set_number: 2, weight: 65.0, reps: 8 }
  └─ Set { id: 103, workout_id: 42, set_number: 3, weight: 70.0, reps: 6 }
```

**Cardinality**: One workout has 1 to 5 sets; one set belongs to exactly one workout.

**Referential Integrity**: Deleting a workout deletes all its sets (ON DELETE CASCADE).

---

## Application-Level Flattening (for Table Display)

For UI rendering, sets are flattened into columns:

```typescript
// From database (normalized):
{
  workout_id: 42,
  workout_date: "2026-05-18",
  exercise_name: "Bench Press",
  sets: [
    { set_number: 1, weight: 60.0, reps: 10 },
    { set_number: 2, weight: 65.0, reps: 8 },
    { set_number: 3, weight: 70.0, reps: 6 }
  ]
}

// Flattened for table row:
{
  id: 42,
  workout_date: "2026-05-18",
  exercise_name: "Bench Press",
  Set1_weight: 60.0,
  Set1_reps: 10,
  Set2_weight: 65.0,
  Set2_reps: 8,
  Set3_weight: 70.0,
  Set3_reps: 6,
  Set4_weight: null,  // no 4th set
  Set4_reps: null,
  Set5_weight: null,
  Set5_reps: null
}
```

**Rationale**: Flat structure maps directly to table columns and is easier to sort/filter in React. Null values represent unused set slots.

---

## Key Constraints & Rules

| Rule | Type | Enforced | Rationale |
|------|------|----------|-----------|
| Workout date ≤ today | Business | DB CHECK + form validation | Only log completed workouts (no planning) |
| ≥ 1 set per workout | Business | Form validation (prevent save without sets) | Requires actual effort data |
| ≤ 5 sets per workout | Business | DB CHECK + form UI disables 6th set | Bounded complexity per exercise |
| Weight > 0 kg | Data | DB CHECK + form validation | Physical constraint; no negative/zero weight |
| Reps > 0 | Data | DB CHECK + form validation | Must have repetitions |
| Set number unique per workout | Data | DB UNIQUE constraint | No duplicate set positions |
| Cascading delete | Data | DB ON DELETE CASCADE | Clean up orphaned sets when workout deleted |

---

## State Diagram (Workout Lifecycle)

```
┌─────────────────────────────┐
│  New Workout (In Form)      │
│  - date, exercise set       │
│  - sets[] initially empty   │
└──────────┬──────────────────┘
           │ User adds ≥1 set
           ▼
┌─────────────────────────────┐
│  Ready to Save              │
│  - All fields valid         │
│  - Can click "Save"         │
└──────────┬──────────────────┘
           │ Save clicked
           ▼
┌─────────────────────────────┐
│  Saved (In Table)           │
│  - Workout + sets in DB     │
│  - Visible in history       │
└──────────┬──────────────────┘
           │
       ┌───┴───┐
       │       │
       ▼       ▼
   Edit    Delete
       │       │
   Update  Remove
       │
       └──────────────────┘
```

---

## Type Definitions (TypeScript)

```typescript
// Core entities
export type Workout = {
  id: number;
  workout_date: string;      // ISO date (YYYY-MM-DD)
  exercise_name: string;
  created_at: string;        // ISO timestamp
  updated_at: string;        // ISO timestamp
};

export type WorkoutSet = {
  id: number;
  workout_id: number;
  set_number: number;        // 1–5
  weight: number;            // kg, > 0
  reps: number;              // positive integer
};

// For form/display
export type WorkoutWithSets = Workout & {
  sets: WorkoutSet[];
};

export type WorkoutTableRow = {
  id: number;
  workout_date: string;
  exercise_name: string;
  Set1_weight: number | null;
  Set1_reps: number | null;
  Set2_weight: number | null;
  Set2_reps: number | null;
  Set3_weight: number | null;
  Set3_reps: number | null;
  Set4_weight: number | null;
  Set4_reps: number | null;
  Set5_weight: number | null;
  Set5_reps: number | null;
};

// Form state
export type WorkoutFormData = {
  workout_date: string;
  exercise_name: string;
  sets: {
    weight: string;         // Stringified for input field; validated before save
    reps: string;
  }[];                      // 1–5 items
};
```

---

## Migration Strategy

**Initial State**: App has no `workout_log` or `workout_set` tables.

**Migration Approach**:
1. Add schema creation to `initDatabase()` in `src/database.ts`
2. Run `CREATE TABLE IF NOT EXISTS` statements before promise resolves (idempotent)
3. Existing users: tables created on first app load after update
4. No data loss: backward-compatible with OPFS persisted DB

**Idempotency**: Schema uses `CREATE TABLE IF NOT EXISTS` so running `initDatabase()` multiple times is safe.

---

## Summary

- **Normalized schema** (Workout + Set) supports 1–5 sets per exercise with full validation at DB level
- **Flattened display model** maps sets to separate columns for table rendering
- **Type-safe data contracts** (TypeScript) catch errors early in form handling and queries
- **Cascading deletes** maintain referential integrity automatically
- **Date validation** enforced at DB level (CHECK constraint) + form level
