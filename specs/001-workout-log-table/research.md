# Research: Workout Log Table Feature

**Date**: 2026-05-18  
**Status**: Complete — No unresolved clarifications  
**Phase**: Phase 0 (Research)

## Architecture & Technology Stack

### Decision: React + TypeScript + SQLite-WASM + Chakra UI

**Rationale**:
- **React**: Existing project tech; component-based UI matches workout table + form pattern
- **TypeScript**: Type safety for database queries and form data; catches bugs early
- **SQLite-WASM**: Per Principle I (local-first); no backend required; OPFS persistence meets offline requirement
- **Chakra UI** (or Tailwind/standard CSS): Responsive primitives (flex, grid) essential for Principle VI (mobile-first); built-in touch-friendly components
- **Vite**: Existing build tool; handles PWA bundling and optimizations

**Alternatives Considered**:
- *IndexedDB instead of SQLite*: Rejected — SQLite provides relational schema + JOIN capability (useful for future analytics); existing app choice
- *Third-party workout app or library*: Rejected — Project is local-first, single-user; no external services
- *Desktop-first layout retrofitted to mobile*: Rejected — Principle VI mandates mobile-first from inception; retrofitting is expensive

### Decision: Table Layout = Separate Columns per Set

**Rationale**:
- **Flat table structure** (workout_date | exercise_name | Set1_weight | Set1_reps | ... | Set5_weight | Set5_reps) maps directly to relational schema
- Avoids nested/hierarchical UI complexity (collapsible rows, detail panes)
- Easy to sort, filter, export (each column is independent)
- Familiar pattern for spreadsheet-like UX
- Responsive: columns wrap or hide on narrow viewports

**Alternatives Considered**:
- *Nested/expandable rows*: More compact on desktop; requires custom row expansion logic; harder to sort by individual set data
- *Cards per workout with inline sets*: Better for narrow mobile; requires different sort/filter UX
- *Separate detail view*: Two-page flow (list + detail); adds navigation complexity

### Decision: Validation = Min 1 Set, No Future Dates

**Rationale**:
- **Minimum 1 set**: A workout with no sets has no data; requiring ≥1 enforces data quality and matches user intent (completed exercise)
- **No future dates**: Fitness logs record completed activity; future dates cause ambiguity (intended vs. completed); standard in fitness apps

**Alternatives Considered**:
- *Allow 0 sets*: Allows logging exercise intention without effort (incomplete data)
- *Allow future dates*: Enables planning; adds "planned" vs. "completed" distinction (scope creep)

### Decision: Default Sort = Most Recent First (Descending Date)

**Rationale**:
- Standard for activity/history logs (most recent appears first)
- Users typically care about latest workouts for progress tracking
- Aligns with app narrative: "log today's workout, see past progress below"

**Alternatives Considered**:
- *Oldest first*: Makes sense for historical archive; not primary use case for active logging
- *User-selectable sort*: More flexible; adds UI complexity (sort menu); deferred to post-MVP

## Database Schema & API

### Table: `workout_log`

```sql
CREATE TABLE IF NOT EXISTS workout_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_date DATE NOT NULL CHECK (workout_date <= DATE('now')),
  exercise_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_set (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL REFERENCES workout_log(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number BETWEEN 1 AND 5),
  weight REAL NOT NULL CHECK (weight > 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  UNIQUE(workout_id, set_number)
);
```

**Schema Notes**:
- `workout_log` stores exercise session metadata
- `workout_set` stores individual sets (1-5 per workout) with weight (kg) and reps
- `workout_date CHECK` enforces no future dates at DB level
- `UNIQUE(workout_id, set_number)` prevents duplicate sets for same workout
- Cascading delete clears sets when workout is deleted
- Timestamps track record lifecycle (useful for future sync/audit features)

## UI Data Contract (Table Rows)

**Display Shape** (what the React component receives):

```typescript
type WorkoutRow = {
  id: number;
  workout_date: string; // ISO date (YYYY-MM-DD)
  exercise_name: string;
  Set1_weight: number | null;
  Set1_reps: number | null;
  Set2_weight: number | null;
  Set2_reps: number | null;
  // ... up to Set5
  Set5_weight: number | null;
  Set5_reps: number | null;
};
```

**Rationale**: Flatten nested sets into columns for table rendering; null values for unused sets (visually empty cells).

## Implementation Dependencies

- Existing `src/database.ts`: reuse `initDatabase()`, `dbPromise`, `dbId` patterns
- Existing `App.tsx`: add `<WorkoutTable />` inside `isDbReady` gate
- React Hooks (`useState`, `useEffect`) for form state and data fetching
- Chakra UI (or CSS Flex/Grid) for responsive table and form layout

## Timeline & Complexity Estimate

- **Database schema + helpers**: ~2 hours (straightforward CRUD + schema definition)
- **WorkoutTable component** (display, sorting, responsive): ~3 hours (table rendering, date formatting, column widths)
- **WorkoutForm component** (create/edit, validation, date picker): ~3 hours (form state, set management, date picker integration)
- **Integration + testing at viewport**: ~1 hour (wire components into App.tsx, test responsive behavior)

**Total estimate**: ~9 hours of focused development

## Summary

No research blockers identified. All decisions are grounded in project constraints (Principle I–VI), existing tech stack, and fitness app conventions. Feature is ready for Phase 1 design and Phase 2 task generation.
