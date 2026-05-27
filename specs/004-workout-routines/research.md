# Research: Workout Routines

## Navigation without React Router

**Decision**: App-level `ActiveView` discriminated union in `App.tsx` state.

**Rationale**: React Router is not installed and Principle V prohibits adding dependencies beyond what the task requires. The app currently has one "page" (WorkoutTable) — adding a tab bar and two full-page sub-views requires only a small state machine, not a routing library. A discriminated union keeps all navigation transitions explicit and type-safe without any extra bundle weight.

**Shape**:
```ts
type ActiveView =
  | { type: 'log' }
  | { type: 'routines' }
  | { type: 'edit-routine'; routineId: number | null }  // null = new
  | { type: 'start-routine'; routineId: number };
```

**Alternatives considered**:
- React Router v6 — rejected: adds ~50 KB, browser history/URL changes are unnecessary for a local-first PWA with no shareable links.
- Hash-based routing — rejected: same overhead without any benefit; the PWA does not need back-button history for sub-views.

## Order Index Strategy for Routine Exercises

**Decision**: Integer `position` column, re-written in full on every reorder.

**Rationale**: With up/down arrow buttons (not drag-and-drop), reordering always swaps two adjacent items. The cleanest model is a dense integer sequence (1, 2, 3 …) stored per exercise. On swap, two UPDATE statements flip the two positions. On delete, re-index remaining positions. This avoids fractional-rank complexity and keeps queries trivially `ORDER BY position ASC`.

**Alternatives considered**:
- Float/fractional ordering (LexoRank style) — rejected: designed for arbitrary-insertion without re-writes, which is a drag-and-drop concern. Overkill here.
- Linked-list (prev/next IDs) — rejected: multi-row JOIN required for ordered reads; no simpler than integer re-index.

## Pre-filling Last Logged Weight/Reps

**Decision**: Query `workout_log` joined to `workout_set` for the most recent entry matching the exercise name (case-insensitive), return its sets ordered by `set_number`.

**Rationale**: The spec says "placeholder values from the most recent workout log entry for that exercise name." The existing schema stores exercise name as free text. A single query with `ORDER BY workout_date DESC, workout_log.id DESC LIMIT 1` gives the latest entry. If no entry exists, placeholders are empty.

**Query**:
```sql
SELECT s.set_number, s.weight, s.reps
FROM workout_log w
JOIN workout_set s ON s.workout_id = w.id
WHERE LOWER(w.exercise_name) = LOWER(?)
ORDER BY w.workout_date DESC, w.id DESC, s.set_number ASC
LIMIT ?  -- suggestedSets count
```

**Alternatives considered**:
- Store per-exercise "last used" in a separate table — rejected: premature, adds schema complexity for a feature that can derive the same answer from the log.
- Match only the most recent set (not grouped by workout) — rejected: the user wants per-set pre-fill that mirrors what they actually did last time.

## Tab Bar Implementation

**Decision**: MUI `Tabs` + `Tab` in the App-level layout, rendered whenever `activeView.type` is `'log'` or `'routines'`. Hidden during full-page sub-views (`edit-routine`, `start-routine`) which render a back-arrow `AppBar` instead.

**Rationale**: MUI `Tabs` is already available (MUI v9 is installed). Full-page sub-views replace the header entirely to give the user a focused, distraction-free logging experience.

**Alternatives considered**:
- Always-visible bottom tab bar — rejected: the existing app uses a top layout; a bottom bar would require significant layout rework with no clear benefit.
- Tabs always visible even during full-page sub-views — rejected: a second tab while filling out a 5-exercise form adds confusion and wastes vertical space on mobile.

## Drizzle Schema + Migration

**Decision**: Add two tables — `routine` and `routine_exercise` — via `drizzle-kit generate`, following the established workflow in Principle III.

**Rationale**: Both tables are new; no existing schema is modified. The migration is purely additive (CREATE TABLE IF NOT EXISTS). Drizzle check constraints enforce domain rules (sets 1–5, reps 1–99, position ≥ 1) at the DB layer, consistent with how `workout_set` constraints are defined.

**No alternatives** — Principle III mandates this workflow.
