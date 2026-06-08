# Research: Routine Draft Persistence

## Decision 1: Draft Storage Mechanism

**Decision**: A new SQLite table `routine_workout_draft` acting as a singleton (at most one row, enforced by `id = 1` constraint and upsert on conflict).

**Rationale**: Confirmed by clarification Q1. The constitution (Principle I) forbids a second client-side persistence layer; localStorage or IndexedDB for app data are explicitly prohibited. SQLite-via-Drizzle is the only sanctioned store. The Drizzle ORM already used for all other entities handles this naturally.

**Alternatives considered**:
- `localStorage`: Rejected — violates constitution Principle I.
- `IndexedDB`: Rejected — same violation as localStorage.
- Existing `app_setting` table (generic key/value): Considered briefly — rejected because it would store structured relational data (a foreign key to `routine`) in a generic text blob with no referential integrity. A typed table is cleaner and allows `ON DELETE CASCADE`.

---

## Decision 2: Draft Data Shape (What to Store)

**Decision**: Store only user-entered set values (reps, weight per row) keyed by `routineExerciseId`. The exercise list is re-read from the live routine on resume.

**Rationale**: Confirmed by clarification Q3. This avoids stale snapshots and keeps the draft minimal. If an exercise is removed from the routine while the draft is live, its values are silently dropped on resume. If an exercise is added, its rows start empty. This is consistent with the "live" design choice.

**Storage format** (JSON in `draft_data` column):
```json
{
  "<routineExerciseId>": [
    { "reps": 10, "weight": 100 },
    { "reps": null, "weight": null }
  ]
}
```
`null` in JSON represents an empty field (stored as `NaN` in the React form). Conversion happens in the repository layer.

**Alternatives considered**:
- Full FormValues snapshot (including exerciseName, classification, all set rows): Rejected per clarification — adds unnecessary coupling to the routine definition at draft creation time.

---

## Decision 3: Singleton Table Pattern

**Decision**: One-row table with `id INTEGER PRIMARY KEY DEFAULT 1` and a `CHECK (id = 1)` constraint. Upsert via `INSERT ... ON CONFLICT(id) DO UPDATE SET ...`.

**Rationale**: SQLite-WASM with Drizzle supports `onConflictDoUpdate`. A singleton table with a fixed PK is a well-established pattern for storing exactly one record (e.g., user settings). It avoids application-level DELETE + INSERT races.

The `routine_id` column carries `REFERENCES routine(id) ON DELETE CASCADE` — this ensures that deleting a routine atomically deletes the draft (FR-010), with no application-level cleanup needed.

**Alternatives considered**:
- Store draft in the existing `app_setting` table as a JSON blob: Rejected — no referential integrity, no cascade delete possible.
- Multiple draft rows (one per routine): Rejected — spec says at most one draft; this would require application-level enforcement anyway.

---

## Decision 4: Auto-Save Trigger

**Decision**: Save on every form value change, debounced at ~500 ms, using `react-hook-form`'s `watch()` in a `useEffect`. The effect fires when the watched values change, with a debounce to avoid per-keystroke writes.

**Rationale**: React Hook Form's `watch()` is the standard pattern for observing all field values. A 500 ms debounce is short enough to capture data before accidental navigation and long enough to avoid saturating the SQLite worker with writes during rapid input.

**Alternatives considered**:
- Save on `onBlur` only: Less reliable — user may navigate away without blurring the last field.
- Save on every navigation event: Would require intercepting React Router navigation, which is fragile and adds complexity.
- No debounce (save synchronously): Would issue a DB write on every keystroke; acceptable given the local SQLite worker but unnecessarily chatty.

---

## Decision 5: Badge Implementation

**Decision**: MUI `Badge` component wrapping the `PlaylistPlayIcon` in `AppLayout`. The badge count is 0 (hidden) or 1 (visible dot). Draft existence is tracked via a `useDraftBadge` hook that queries the DB on mount and re-checks whenever the route changes to/from `/routines`.

**Rationale**: MUI `Badge` with `variant="dot"` produces a clean visual indicator without a count. The `useDraftBadge` hook keeps the badge logic decoupled from `AppLayout`'s existing DB-init concern. The hook re-fetches when navigating to the Routines tab (via `useEffect` on `location.pathname`) so the badge clears immediately after a draft is discarded without a full page reload.

**Alternatives considered**:
- Global React context for draft state: Overkill for a single boolean; adds indirection.
- Redux / Zustand store: No state management library in this codebase; not justified for one boolean.

---

## Decision 6: Discard Confirmation

**Decision**: Reuse the existing `ConfirmDialog` component. The "Discard" button is added to `RoutineWorkoutView`. Confirming calls `clearDraft()` then navigates to `/routines`.

**Rationale**: `ConfirmDialog` is already used in the routine delete flow and has the exact semantics needed (confirm/cancel with a danger color).

---

## Decision 7: Resume Entry Point

**Decision**: `RoutineList` queries `getDraft()` on mount and passes `draftRoutineId` to `RoutineListView` → `RoutineCard`. Tapping the badged card navigates to `/routines/:id/start` as normal. `useRoutineWorkout.load()` checks for a draft matching the routineId and pre-populates form default values from it.

**Rationale**: This reuses the existing navigation path without a new route. The restore logic lives inside `useRoutineWorkout`, keeping the container responsible for all data concerns. No new routes or route params needed.
