# Research: Exercise Names in Tables

**Branch**: `016-exercise-names-tables` | **Date**: 2026-06-12

## Summary

No external unknowns. All decisions derive directly from the existing codebase patterns.

---

## Decision 1: Preference storage

**Decision**: Reuse the existing `app_setting` key-value table via `AppSettingRepository`.  
**Rationale**: The table already handles the `body_weight` setting with the same shape (string key → string value). No migration is needed — the table exists in every user's DB already. A new key `exercise_names_in_tables` with values `"true"` / `"false"` fits cleanly.  
**Alternatives considered**: A dedicated boolean column on a settings row; localStorage. Both rejected — the first adds DDL complexity, the second violates Principle I.

---

## Decision 2: Propagation mechanism (context vs. props)

**Decision**: Pass `showExerciseNames: boolean` as a prop to `GroupedWorkoutTable`. Load the value in each container that uses the table (`useWorkouts`, Settings).  
**Rationale**: Only two call-sites need the value. React Context would be premature — it introduces a provider that crosses route boundaries for a single boolean. Prop threading is explicit and follows the existing pattern in the codebase (every container reads what it needs from the DB and passes it down as props).  
**Alternatives considered**: AppSettingsContext at `App.tsx` level. Rejected per Principle V (no abstractions beyond what the task requires).

---

## Decision 3: GroupedWorkoutTable API change

**Decision**: Replace `showExerciseNames: boolean` with a discriminated `firstColumn: 'avatar' | 'name' | 'none'` prop.  
**Rationale**: The three modes are mutually exclusive and have different rendering logic. A union type makes each call-site's intent explicit and prevents invalid combinations. Required (not optional) so TypeScript enforces every call-site makes a deliberate choice.  
**Column widths**: `'avatar'` → 64 px; `'name'` → 120 px fixed (ellipsis on overflow); `'none'` → column removed entirely.

---

## Decision 4: Exercise Detail page — no identity column

**Decision**: `ExerciseDetailView` passes `firstColumn="none"` unconditionally.  
**Rationale**: On the exercise detail page the user already knows which exercise they're on. Neither the avatar nor the name adds information — removing the column gives the set data more horizontal space. Hardcoded, no toggle dependency.

---

## Decision 5: Settings UI — toggle placement

**Decision**: Add the toggle under a new "Display" section in `SettingsView`, above the existing "Data" section.  
**Rationale**: Display preferences are conceptually distinct from data import/export. A labelled section heading keeps the settings page scannable as it grows.

---

## No-ops

- **No migration file needed**: `app_setting` table already exists; Drizzle schema is unchanged.
- **No new route**: feature lives entirely within existing Settings, Workout Log, and Exercise Detail routes.
- **Advanced View**: unchanged and out of scope.
