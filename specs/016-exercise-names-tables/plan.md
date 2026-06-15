# Implementation Plan: Exercise Names in Tables

**Branch**: `016-exercise-names-tables` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-exercise-names-tables/spec.md`

## Summary

Add an "Exercise Names in Tables" boolean toggle to the Settings screen, persisted in the existing `app_setting` SQLite key-value table. When on, the Workout Log's `GroupedWorkoutTable` replaces the 64px avatar column with a 120px exercise-name text column (CSS-truncated). The Individual Exercise detail page always omits the identity column entirely, controlled by a new `firstColumn: 'avatar' | 'name' | 'none'` prop on `GroupedWorkoutTable`.

No schema migration is needed — the `app_setting` table already exists. The preference is read on each Workout Log mount; no shared React Context is required.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Vite 5  
**Primary Dependencies**: MUI v6, Drizzle ORM, SQLite-WASM/OPFS  
**Storage**: SQLite — `app_setting` key-value table (already exists, no migration)  
**Testing**: None (no runner configured, per constitution Principle V)  
**Target Platform**: Browser PWA, mobile-first (≥320px)  
**Project Type**: Single-project web app (browser-only)  
**Performance Goals**: N/A — local SQLite read is sub-millisecond  
**Constraints**: Additive key only; no shared React Context; firstColumn resolved on next navigation  
**Scale/Scope**: 2 route modifications, 1 shared component change, 1 new hook, 1 new presentational component

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Local-First | ✅ Pass | New key in existing `app_setting` SQLite table; no backend, no localStorage |
| II. Single Worker / Single Init | ✅ Pass | Drizzle `database` singleton used; no new worker instantiation |
| III. Schema-Complete Before Ready | ✅ Pass | No new tables or columns — `app_setting` already in schema and migrations |
| IV. Parameterized SQL Only | ✅ Pass | Drizzle ORM handles parameterization automatically |
| V. Simplicity & Explicit Scope | ✅ Pass | No new abstractions beyond what the task requires; no test runner added |
| VI. Mobile-First, Adaptive UI | ✅ Pass | MUI Switch (≥44px touch target); 120px name column with `text-overflow: ellipsis` |
| VII. Component Separation | ✅ Pass | New hook carries logic; new `DisplaySettings` component is pure presentational |
| VIII. Code Organization & File Size | ✅ Pass | All new files well under 200 lines; grouped by entity in existing folder structure |
| IX. Strong TypeScript Types | ✅ Pass | Union prop `'avatar' \| 'name' \| 'none'`; hook return typed via `ReturnType<>` |

**Post-design re-check**: ✅ Confirmed — no violations introduced in Phase 1 design.

## Project Structure

### Documentation (this feature)

```text
specs/016-exercise-names-tables/
├── plan.md              # This file
├── research.md          # Phase 0 — existing schema and component audit
├── data-model.md        # Phase 1 — new app_setting key definition
├── quickstart.md        # Phase 1 — implementation quickstart
├── contracts/
│   └── exercise-names-tables.md   # Phase 1 — public API and prop contracts
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── db/entities/app-setting/
│   └── repository.ts            [modify] add getExerciseNamesInTables / setExerciseNamesInTables
├── database.ts                  [modify] export getExerciseNamesInTables / setExerciseNamesInTables
└── routes/
    ├── settings/
    │   ├── hooks/
    │   │   └── useExerciseNamesInTables.ts  [new] load/save the toggle preference
    │   ├── DisplaySettings.tsx              [new] presentational toggle row component
    │   ├── views/
    │   │   └── SettingsView.tsx             [modify] add Display section with toggle
    │   └── index.tsx                        [modify] wire useExerciseNamesInTables
    ├── workouts/
    │   ├── GroupedWorkoutTable/
    │   │   └── index.tsx                   [modify] add firstColumn prop
    │   ├── hooks/
    │   │   └── useWorkouts.ts              [modify] load setting on refresh, return showExerciseName
    │   └── views/
    │       └── WorkoutsView.tsx            [modify] pass firstColumn to GroupedWorkoutTable
    └── exercises/Exercise/ExerciseDetail/
        └── views/
            └── ExerciseDetailView.tsx      [modify] pass firstColumn="none"
```

**Structure Decision**: Single-project (Option 1). All changes are confined to existing src/ hierarchy; no new top-level folders needed.

## Complexity Tracking

> No constitution violations — this section is empty by design.
