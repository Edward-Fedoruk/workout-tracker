# Data Model: Workout Routines

## New Entities

### `routine`

Represents a named workout template.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PK, autoincrement | |
| `name` | TEXT | NOT NULL, CHECK(length ≤ 100) | User-defined name |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | ISO-8601 date-time |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Updated on any change |

**Drizzle schema**:
```ts
export const routine = sqliteTable('routine', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  check('routine_name_length', sql`length(${table.name}) <= 100`),
]);
```

---

### `routine_exercise`

An ordered exercise entry within a routine.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PK, autoincrement | |
| `routine_id` | INTEGER | NOT NULL, FK → `routine.id` ON DELETE CASCADE | |
| `exercise_name` | TEXT | NOT NULL | Free-form text |
| `suggested_sets` | INTEGER | NOT NULL, CHECK(1–5) | Advisory |
| `suggested_reps` | INTEGER | NOT NULL, CHECK(1–99) | Advisory, reps per set |
| `position` | INTEGER | NOT NULL, CHECK(≥ 1) | Dense integer rank; unique per routine |

**Drizzle schema**:
```ts
export const routineExercise = sqliteTable('routine_exercise', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routineId: integer('routine_id').notNull().references(() => routine.id, { onDelete: 'cascade' }),
  exerciseName: text('exercise_name').notNull(),
  suggestedSets: integer('suggested_sets').notNull(),
  suggestedReps: integer('suggested_reps').notNull(),
  position: integer('position').notNull(),
}, (table) => [
  unique().on(table.routineId, table.position),
  check('suggested_sets_check', sql`${table.suggestedSets} BETWEEN 1 AND 5`),
  check('suggested_reps_check', sql`${table.suggestedReps} BETWEEN 1 AND 99`),
  check('position_check', sql`${table.position} >= 1`),
]);
```

---

## Existing Entities (unchanged)

### `workout_log` / `workout_set`

No schema changes. Routine-based workouts create rows in these tables via the existing `createWorkout` helper — one call per filled-in exercise.

---

## Relationships

```
routine 1 ──< routine_exercise  (cascade delete)
workout_log 1 ──< workout_set   (cascade delete, existing — unchanged)
```

Routines are independent of `workout_log`. A routine is a template only; it has no FK relationship to the workout log entries it produces. Past log entries are never modified when a routine changes.

---

## TypeScript Types (exported from `database.ts`)

```ts
export type Routine = typeof routine.$inferSelect;
export type RoutineExercise = typeof routineExercise.$inferSelect;

export type RoutineWithExercises = Routine & {
  exercises: RoutineExercise[];   // ordered by position ASC
};
```

---

## Ordering Invariant

`routine_exercise.position` is a dense integer sequence starting at 1, unique per `routine_id`. Operations that change order:

| Operation | Effect on positions |
|-----------|-------------------|
| Add exercise | Append at `MAX(position) + 1` |
| Move up (↑) | Swap `position` with the row above |
| Move down (↓) | Swap `position` with the row below |
| Delete exercise | Remove row; re-index remaining rows as `1, 2, 3 …` |

Re-indexing on delete ensures the sequence stays dense and avoids gaps that could complicate future reorders.
