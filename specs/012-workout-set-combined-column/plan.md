# Implementation Plan: Combined Workout Set Column (weight × reps)

**Branch**: `012-workout-set-combined-column` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-workout-set-combined-column/spec.md`

## Summary

The workout table currently renders three columns per set (`S{n} kg`, `S{n} reps`, `S{n} eRM`). This feature merges the weight and reps columns into a single column per set that displays `<weight>kg × <reps>` (e.g. `25kg × 10`), while leaving the eRM column untouched. The change is presentation-only: it edits the Material React Table column definitions in `src/routes/workouts/WorkoutSetRow.tsx` and introduces a pure formatting helper. No database, SQL, schema, query, or data-model change is involved.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19 (JSX)
**Primary Dependencies**: `material-react-table` (table + column defs), `@mui/material` (layout)
**Storage**: SQLite-WASM + OPFS — **unchanged** (no read/write/schema change; `WorkoutTableRow` already exposes `Set{n}_weight` and `Set{n}_reps`)
**Testing**: None configured (Constitution Principle V); manual verification via `npm run dev`
**Target Platform**: Browser PWA (cross-origin-isolated), mobile-first
**Project Type**: Single-project web app (local-first PWA)
**Performance Goals**: No change — purely a render-side string format per visible cell
**Constraints**: Offline-capable, no backend; mobile viewport ≥320px
**Scale/Scope**: 1 file edited (`WorkoutSetRow.tsx`); ~5 visible sets × table rows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | ✅ PASS | No backend or alternate persistence touched. |
| II. Single Worker, Single Init | ✅ PASS | No DB access added; helper is pure UI formatting. |
| III. Schema-Complete Before Ready | ✅ PASS | No schema/migration — FR-004 is explicit (UI-only). |
| IV. Parameterized SQL Only | ✅ PASS | No SQL changes. |
| V. Simplicity & Explicit Scope | ✅ PASS | One file; no new abstraction, no test runner added. |
| VI. Mobile-First, Adaptive UI | ✅ PASS | Merging two columns into one **reduces** horizontal width — net positive on narrow viewports. |
| VII. Component Separation | ✅ PASS | `WorkoutSetRow.tsx` holds presentational column defs; formatting is a pure named export. |
| VIII. Code Organization & File Size | ✅ PASS | File shrinks (3 columns/set → 2). Pure named export helper. No new loose files; no `../` imports added. |
| IX. Strong TypeScript Types | ✅ PASS | Helper typed `(weight: null \| number, reps: null \| number) => string`; no casts. |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/012-workout-set-combined-column/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── set-column-format.md   # UI contract for the combined cell
├── checklists/
│   └── requirements.md  # From /speckit.specify
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/routes/workouts/
├── WorkoutSetRow.tsx          # EDIT — merge weight+reps column; add formatSetCell helper; update HIDDEN_SET_COLUMNS
└── views/
    └── WorkoutsView.tsx       # NO CHANGE — already spreads useSetColumns() and applies HIDDEN_SET_COLUMNS

src/db/entities/workout-log/
└── types.ts                   # NO CHANGE — WorkoutTableRow already exposes Set{n}_weight / Set{n}_reps
```

**Structure Decision**: Single-project web app. The entire change lives in `src/routes/workouts/WorkoutSetRow.tsx`, which owns the per-set column definitions consumed by `WorkoutsView`. `WorkoutsView.tsx` requires no change because it consumes `useSetColumns()` and `HIDDEN_SET_COLUMNS` opaquely.

## Complexity Tracking

> No constitution violations — section intentionally empty.
