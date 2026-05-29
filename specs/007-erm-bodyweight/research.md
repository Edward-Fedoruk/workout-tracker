# Research: eRM & Body Weight Settings

**Feature**: `007-erm-bodyweight` | **Date**: 2026-05-29

## Decision 1: Body weight storage mechanism

**Decision**: A generic key-value `app_setting` table (`key TEXT PRIMARY KEY, value TEXT NOT NULL`).

**Rationale**: Body weight is the first app-wide setting, but the Settings page is explicitly designed to host future settings. A single-row `user_body_weight` table works but can't extend without schema changes. A key-value settings table is additive — future settings are new rows, not new tables. The implementation stays simple: `getBodyWeight()` and `setBodyWeight(value)` helpers that read/write the `'body_weight'` key.

**Alternatives considered**:
- Dedicated `user_body_weight` table: works but couples schema to a single setting.
- `localStorage`: violates Constitution Principle I (no second persistence layer for domain data).

---

## Decision 2: Relaxing the `weight > 0` constraint for assisted exercises

**Decision**: Drop the `weight_check` constraint from `workout_set` entirely via a table-rebuild migration (create `__new_workout_set`, copy data, drop original, rename). Weight validation moves to the application layer in `WorkoutForm`, conditioned on exercise classification.

**Rationale**: SQLite does not support `ALTER TABLE ... DROP CONSTRAINT`. The existing `0004_reps_range.sql` migration established the precedent of table-rebuild for constraint changes. The application layer already validates weight before writing; moving the `> 0` guard there is consistent with how `reps_check` works in practice (the UI prevents invalid reps). The constraint is removed at DB level; classification-aware rules (`weight > 0` for standard, `weight >= 0` for bodyweight, any value for assisted) are enforced in the form component.

**Alternatives considered**:
- Keep `weight_check` and store absolute values + a sign flag: needlessly complex; breaks the straightforward arithmetic in Epley.
- Relax to `weight >= -500`: a partial constraint doesn't add meaningful safety since the UI is the real gate.

---

## Decision 3: eRM calculation placement

**Decision**: A pure utility function `computeERM(weight: number, reps: number): number` in a new `src/utils/erm.ts`. The display logic in `WorkoutTable` resolves the exercise classification and body weight, computes the effective weight, then calls `computeERM`. The result is rendered inline.

**Rationale**: Constitution Principle VIII (≤200 lines/file) and Principle VII (container/presentational separation) both push the formula out of the component. A pure function is easy to reason about, has no async concerns, and requires no DB access. `WorkoutTable` (container) already owns the workout data; it can receive body weight and exercise classifications as additional state and apply the formula before passing display props to a presentational sub-component.

**Alternatives considered**:
- Compute in a DB helper: eRM is derived, not stored; performing arithmetic in SQL adds complexity without benefit.
- Compute in a React `useMemo` hook inline in the component: acceptable, but extracting to `src/utils/erm.ts` makes the formula independently legible and reusable.

---

## Decision 4: Exercise classification column placement

**Decision**: Add a `classification` column to the existing `exercise` table via `ALTER TABLE exercise ADD COLUMN classification TEXT NOT NULL DEFAULT 'standard' CHECK(classification IN ('standard', 'bodyweight', 'assisted'))`.

**Rationale**: Classification is an intrinsic property of an exercise (like its name), not a join table. `ALTER TABLE ... ADD COLUMN` with a default is safe in SQLite and doesn't require a table rebuild. All existing exercises get `standard` on migration — backward-compatible by design.

**Alternatives considered**:
- Separate `exercise_classification` table: over-engineered for a three-value enum; the join adds query complexity without benefit.
- Store as a number/enum integer: text is more legible in migration SQL and debugging sessions; discriminated-union types in TypeScript provide compile-time safety regardless of DB representation.

---

## Decision 5: Settings page navigation

**Decision**: Add `'settings'` as a fourth entry in the `ActiveView` union in `App.tsx` and add a "Settings" tab to the existing `<Tabs>` bar.

**Rationale**: The app already uses a tab-based navigation pattern for Log, Routines, and Exercises. Adding Settings as a fourth tab is consistent, requires the least code (no new navigation primitive), and is immediately discoverable. The `showTabBar` condition currently hides tabs on sub-views (edit-routine, start-routine); Settings is a top-level destination so it also shows the tab bar.

**Alternatives considered**:
- Hamburger/drawer menu: heavier to build, no existing pattern in the codebase, and the tab bar has room for a fourth item.
- Icon-only settings button in the header: requires adding a header component that doesn't currently exist.
