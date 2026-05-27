# Data Model: Custom Exercise Library

## New Tables

### `exercise`

The canonical library of named exercises.

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `name` | TEXT | NOT NULL |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP |

**Uniqueness**: `name` must be unique case-insensitively. Enforced at the application layer (helper validates before INSERT/UPDATE) rather than via a `COLLATE NOCASE` index, to produce a friendly error message instead of a SQLite constraint violation.

---

### `muscle_group`

The managed list of muscle group labels.

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `name` | TEXT | NOT NULL |

**Uniqueness**: same case-insensitive rule as `exercise.name`.

---

### `exercise_muscle_group`

Many-to-many join between exercises and muscle groups.

| Column | Type | Constraints |
|---|---|---|
| `exercise_id` | INTEGER | NOT NULL, FK → `exercise(id)` ON DELETE CASCADE |
| `muscle_group_id` | INTEGER | NOT NULL, FK → `muscle_group(id)` ON DELETE CASCADE |

**Primary key**: composite `(exercise_id, muscle_group_id)`.

**Cascade rules**:
- Deleting an `exercise` row cascades and removes all its `exercise_muscle_group` rows automatically.
- Deleting a `muscle_group` row cascades and removes the association rows, but does NOT delete the exercise. Exercises with zero remaining groups are permitted in the DB; the UI shows a warning.

---

## Modified Tables

### `workout_log` — unchanged schema

The existing `exercise_name TEXT NOT NULL` column continues to act as a snapshot. No new columns are added.

| On rename | On delete |
|---|---|
| `UPDATE workout_log SET exercise_name = ? WHERE exercise_name = ?` (inside rename transaction) | No change — name snapshot remains |

### `routine_exercise` — unchanged schema

The existing `exercise_name TEXT NOT NULL` column continues to act as a reference by name.

| On rename | On delete |
|---|---|
| `UPDATE routine_exercise SET exercise_name = ? WHERE exercise_name = ?` | `DELETE FROM routine_exercise WHERE exercise_name = ?` (slot removed) |

---

## Seed Data

Inserted by the Drizzle migration using `INSERT OR IGNORE INTO` to be safe on non-fresh databases.

### Muscle Groups (12)

Back, Biceps, Calves, Chest, Core, Forearms, Glutes, Hamstrings, Quads, Rear Delts, Shoulders, Triceps

### Exercises with Muscle Group Assignments (24)

| Exercise | Muscle Groups |
|---|---|
| Abs (BW) | Core |
| Assisted Chin-up | Back, Biceps |
| Barbell Squat | Quads, Hamstrings, Glutes |
| Bench Press | Chest, Triceps |
| Cable Curl (rope) | Biceps |
| Cable Lateral Raise | Shoulders |
| Cable Pushdown (rope) | Triceps |
| Cable Row | Back, Biceps |
| Close Grip Bench Press | Triceps, Chest |
| DB Lateral Raise | Shoulders |
| Dips (BW) | Chest, Triceps |
| Dumbbell Overhead Press | Shoulders, Triceps |
| Dumbbell RDL | Hamstrings, Glutes |
| Hack Squat Machine | Quads, Glutes |
| Hammer Curl | Biceps, Forearms |
| Incline Press Machine | Chest, Shoulders |
| Lat Pull Down | Back, Biceps |
| Leg Curl Machine | Hamstrings |
| Leg Extension Machine | Quads |
| Rear Delt Pec Deck | Rear Delts |
| Reverse Curl | Forearms, Biceps |
| Seated Calf Machine | Calves |
| Seated Row | Back, Biceps |
| Wrist Curl | Forearms |

---

## Entity Relationships

```
muscle_group (1) ─────────── (M) exercise_muscle_group (M) ─────────── (1) exercise
                                                                              │
                                                         workout_log.exercise_name (text snapshot, updated on rename)
                                                         routine_exercise.exercise_name (text snapshot, updated on rename, row deleted on exercise delete)
```

---

## Validation Rules (application layer)

| Rule | Where enforced |
|---|---|
| Exercise name 1–100 chars, non-empty after trim | Helper before INSERT/UPDATE |
| Exercise name case-insensitively unique | Helper SELECT before INSERT/UPDATE |
| Muscle group name 1–50 chars, non-empty after trim | Helper before INSERT/UPDATE |
| Muscle group name case-insensitively unique | Helper SELECT before INSERT/UPDATE |
| Exercise must have ≥ 1 muscle group on create/edit | Form validation before save |
