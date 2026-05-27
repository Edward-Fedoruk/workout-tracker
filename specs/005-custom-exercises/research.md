# Research: Custom Exercise Library

## Decision 1 — Exercise storage strategy (text snapshot vs FK)

**Decision**: Keep `workout_log.exercise_name` and `routine_exercise.exercise_name` as plain-text snapshots. Add a new `exercise` table as the library source of truth without adding FK columns to the existing tables.

**Rationale**: SQLite cannot drop `NOT NULL` constraints without a full table rewrite (CREATE new → INSERT → DROP old → RENAME). Drizzle generates correct migration SQL for this, but it adds complexity and migration risk against user OPFS databases that have existing data. The text-snapshot approach achieves the same observable behavior — rename propagates via `UPDATE ... WHERE exercise_name = ?`, delete clears routine slots via `DELETE FROM routine_exercise WHERE exercise_name = ?` and leaves workout_log rows untouched — without schema surgery on existing tables.

**Alternatives considered**:
- *FK column on existing tables* (`exercise_id INTEGER NULL REFERENCES exercise(id)`): Cleaner relational model but requires a Drizzle table-rewrite migration and makes every existing row require a back-fill join at migration time. Deferred to a future refactor if needed.
- *Store exercise_id only, drop exercise_name*: Breaks the "log entries survive exercise deletion" requirement — once the exercise row is deleted, there's no name to display.

---

## Decision 2 — Muscle group cardinality

**Decision**: Many-to-many via a `exercise_muscle_group` join table. An exercise must have at least one group assigned; the constraint is enforced at the application layer (form validation), not at the database layer.

**Rationale**: SQLite does not support `CHECK` constraints that span multiple rows (e.g., "this exercise has at least one muscle_group row"), so the "at least one" rule must live in the service/helper layer. The join table is the standard relational pattern; it handles multi-group assignments cleanly and allows muscle groups to be renamed or deleted independently.

**Alternatives considered**:
- *Comma-separated names in a text column*: Simple but untidy for querying; filtering by muscle group becomes a `LIKE '%Chest%'` scan.
- *Single muscle_group_id FK on exercise*: Contradicts the user's explicit choice of one-or-more.

---

## Decision 3 — Exercise rename propagation

**Decision**: When an exercise is renamed, run three UPDATE statements in a single transaction: (1) `UPDATE exercise SET name = ?`, (2) `UPDATE workout_log SET exercise_name = ? WHERE exercise_name = ?`, (3) `UPDATE routine_exercise SET exercise_name = ? WHERE exercise_name = ?`.

**Rationale**: This keeps all three tables consistent without requiring FK columns. SQLite's exclusive OPFS lock means no concurrent writer can race in between statements inside a transaction. The case-insensitive uniqueness constraint on `exercise.name` (enforced at the app layer) prevents two exercises from ever sharing the same name, so the WHERE clause is unambiguous.

---

## Decision 4 — Exercise delete behavior

**Decision**: Deleting an exercise runs two statements in a transaction: (1) `DELETE FROM routine_exercise WHERE exercise_name = ?` (clears slots), (2) `DELETE FROM exercise WHERE id = ?`. Workout log rows are untouched.

**Rationale**: Matches spec FR-008/FR-009 and the "routine slot becomes empty" edge case. Deleting the `routine_exercise` rows (rather than nulling out `exercise_name`) avoids a schema change and is semantically correct — a slot with no exercise assigned is represented by the absence of a row, not a nullable column.

---

## Decision 5 — Exercise picker UI component

**Decision**: Use MUI `Autocomplete` (with `freeSolo={false}`) to replace the plain `TextField` for exercise name input in `WorkoutForm` and `RoutineEditor`. The Autocomplete is loaded with the full exercise list on mount.

**Rationale**: MUI Autocomplete provides built-in keyboard navigation, filtering, and mobile-friendly touch behavior that aligns with Constitution Principle VI (mobile-first, 44×44px targets). `freeSolo={false}` ensures only library exercises are selected, preventing data divergence between workout log names and the exercise table.

---

## Decision 6 — Seed data insertion

**Decision**: The 24 exercises and 12 muscle groups are seeded inside the Drizzle migration that creates the `exercise`/`muscle_group`/`exercise_muscle_group` tables, using `INSERT OR IGNORE INTO` so re-running the migration on a non-fresh DB is safe.

**Rationale**: Seeding in the migration file is the canonical location per Constitution Principle III ("schema-complete before ready"); it runs exactly once per DB lifecycle and is tracked by the `__drizzle_migrations` table. Application-layer seeding (e.g., a one-time check in `initDatabase`) would require a separate `seeded` flag, creating two sources of truth.

---

## Decision 7 — Navigation: Exercise Library tab

**Decision**: Add "Exercises" as a third top-level tab in `App.tsx` alongside "Log" and "Routines". The tab renders the `ExerciseLibrary` container, which shows a tabbed sub-view for Exercises and Muscle Groups.

**Rationale**: The spec mandates a dedicated Exercise Library screen accessible from main navigation (Clarification Q1). A third tab is the lowest-friction addition to the existing tab-bar pattern. Muscle group management lives on the same screen (second sub-tab) to keep exercise-related management co-located without adding a fourth top-level tab.
