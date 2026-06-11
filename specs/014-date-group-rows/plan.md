# Implementation Plan: Date Group Rows in Workout Log

**Branch**: `014-date-group-rows` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-date-group-rows/spec.md`

## Summary

Replace the workout log's standalone "Date" column with **static, full-width divider lines** that separate records into per-day sections, each labeled relatively ("Today", "Yesterday", a weekday name, or a calendar date). This grouped view is the default and is **locked to newest-first date order** (no user sorting/filtering). A toggle switches to an **Advanced view** that drops the dividers, restores the date as a normal column, and enables the full MaterialReactTable interaction set (sort/filter/column visibility). The chosen view mode persists across visits via the existing `app_setting` table.

Technical approach: the default grouped view is rendered as a **dedicated presentational component** (not MRT), because MRT's native grouping is collapsible and column-shaped — which the spec explicitly forbids (FR-001a). The Advanced view **reuses the existing MaterialReactTable** path (today's `WorkoutsView`). A pure date-label utility and a pure grouping utility drive the labels; set-cell rendering is shared via the already-exported `formatSetCell`. No schema/migration is required — view-mode persistence adds a key/value row, not DDL.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Vite  
**Primary Dependencies**: `material-react-table` (+ MUI), `@sqlite.org/sqlite-wasm` (via `src/database.ts` only), Drizzle ORM (`app_setting` access)  
**Storage**: SQLite-WASM over OPFS; view-mode preference stored as a row in the existing `app_setting` (key/value text) table — no new table or column  
**Testing**: None configured (Principle V); verification is manual via `npm run dev` / `npm run preview`  
**Target Platform**: Browser PWA, mobile-first (≥320px), cross-origin-isolated  
**Project Type**: Single-project local-first web app (`src/`)  
**Performance Goals**: 60 fps scroll over a typical personal log (hundreds of rows); label/grouping computation is O(n) over already-loaded rows  
**Constraints**: Offline-capable, no backend, no second persistence layer; dividers must be static (non-sticky, FR-001c) and non-collapsible (FR-001a)  
**Scale/Scope**: One feature area (`src/routes/workouts/`), one new util module, two presentational view components, one repository accessor pair; ~5–7 files touched/created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Local-First (NON-NEGOTIABLE) | ✅ PASS | View-mode preference persisted in SQLite `app_setting`, not localStorage/IndexedDB. No backend/sync introduced. |
| II. Single Worker, Single Init | ✅ PASS | All DB access via typed helpers exported from `src/database.ts`; no direct `promiser`/sqlite-wasm import in UI. |
| III. Schema-Complete Before Ready | ✅ PASS | **No DDL.** `app_setting` already exists; we add a new key (`workout_view_mode`) — a data row, not a schema change. No `drizzle-kit generate` needed. |
| IV. Parameterized SQL Only | ✅ PASS | Persistence uses Drizzle ORM (`insert(...).onConflictDoUpdate`) exactly like `setBodyWeight`; no string-interpolated SQL. |
| V. Simplicity & Explicit Scope | ✅ PASS | No tests/infra added. Advanced view reuses existing MRT. The one added abstraction (a bespoke grouped view) is justified: MRT cannot satisfy FR-001a without fighting its collapsible grouping. Some row-render duplication is accepted and noted. |
| VI. Mobile-First, Adaptive UI | ✅ PASS | Divider rows are full-width/responsive; the view toggle must be ≥44×44px touch target and verified at 320px. |
| VII. Component Separation of Concerns | ✅ PASS | Grouped/Advanced views are presentational; `useWorkouts` (container) owns view-mode state + persistence side effects. |
| VIII. Code Organization & File Size | ✅ PASS | New components each get an `index.tsx` in their own folder; pure utils in `src/utils/`; all cross-dir imports via `@/`. Files kept <200 lines. |
| IX. Strong TypeScript Types | ✅ PASS | View mode modeled as a union literal type; no `any`/`unknown` casts. |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/014-date-group-rows/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI/module contracts)
│   ├── date-group-util.md
│   ├── grouped-log-view.md
│   └── view-mode-persistence.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── utils/
│   ├── erm.ts                     # (existing)
│   └── dateGroup.ts               # NEW — pure: relative label + grouping helpers
├── db/entities/app-setting/
│   ├── schema.ts                  # (existing, unchanged)
│   └── repository.ts              # EDIT — add get/set WorkoutViewMode
├── database.ts                    # EDIT — re-export getWorkoutViewMode/setWorkoutViewMode + types
└── routes/workouts/
    ├── index.tsx                  # (container — unchanged or minimal)
    ├── hooks/
    │   └── useWorkouts.ts         # EDIT — load/hold/persist viewMode; expose toggle
    ├── views/
    │   └── WorkoutsView.tsx       # EDIT — pick grouped vs advanced; render toggle
    ├── GroupedWorkoutLog/         # NEW — presentational, default view
    │   └── index.tsx              # divider rows + grouped records
    ├── WorkoutSetRow.tsx          # (existing — reuse formatSetCell, set-visibility)
    └── WorkoutRowActions.tsx      # (existing — reused by both views)
```

**Structure Decision**: Single-project layout under `src/`. The feature is confined to `src/routes/workouts/` plus one shared pure util (`src/utils/dateGroup.ts`) and one repository accessor pair. The default grouped view becomes its own component folder (`GroupedWorkoutLog/index.tsx`) per Principle VIII; the Advanced view is the existing MaterialReactTable in `WorkoutsView.tsx`, which becomes a thin switch between the two modes plus the toggle control.

## Complexity Tracking

> No constitutional violations. Section intentionally empty.
