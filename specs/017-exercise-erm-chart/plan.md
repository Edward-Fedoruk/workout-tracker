# Implementation Plan: Exercise eRM Performance Chart

**Branch**: `017-exercise-erm-chart` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/017-exercise-erm-chart/spec.md`

## Summary

Add a line chart to the existing `ExerciseDetail` page that visualizes Estimated 1-Rep Max (eRM) over time, with one color-coded series per set number (Set 1–5) and a three-option time-range filter (All Time / Last Year / Last Month). eRM is already pre-computed and stored in `workout_set.erm`; no schema migration is needed. The existing `listWorkoutsByExerciseName` query already returns the pivoted `Set1_erm … Set5_erm` data per session — the only missing piece is exposing those raw rows from `useExerciseDetail` and rendering a new `ExerciseErmChart` presentational component using `@mui/x-charts`.

## Technical Context

**Language/Version**: TypeScript 5.5 / React 18.3 (Vite 5.4)  
**Primary Dependencies**: MUI v9, Drizzle ORM v0.45, SQLite-WASM 3.46, react-router-dom v7  
**New Dependency**: `@mui/x-charts` (not yet installed — add to `dependencies`)  
**Storage**: SQLite-WASM → OPFS (local-first, no backend)  
**Testing**: None configured (Principle V — do not add ad-hoc)  
**Target Platform**: Browser PWA, mobile-first (≥320px viewport)  
**Performance Goals**: Chart renders in <1 second for typical personal history (~100 sessions max)  
**Constraints**: Offline-capable, no backend calls, COOP/COEP headers required  
**Scale/Scope**: Single user, single device, max 5 set series, personal workout history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Local-First | ✅ PASS | Chart reads from SQLite via existing DB function; no backend, no localStorage |
| II. Single Worker, Single Init | ✅ PASS | Uses existing `listWorkoutsByExerciseName` via `database.ts`; no new worker init |
| III. Schema-Complete Before Ready | ✅ PASS | No schema changes; eRM already stored |
| IV. Parameterized SQL Only | ✅ PASS | No new SQL — reuses existing parameterized query |
| V. Simplicity & Explicit Scope | ✅ PASS | Minimal surface: one new component, one state addition to existing hook |
| VI. Mobile-First, Adaptive UI | ✅ PASS | Chart must use `width: 100%`, min 44px touch targets on filter buttons |
| VII. Component Separation | ✅ PASS | `ExerciseErmChart` is purely presentational; time-range filter state stays inside it |
| VIII. Code Organization | ✅ PASS | New component in its own folder `ExerciseErmChart/index.tsx`; `@/` imports only |
| IX. Strong TypeScript Types | ✅ PASS | No `as any`; MUI X Charts has TypeScript declarations |

**Post-design re-check**: All principles remain satisfied. No violations. Complexity Tracking table omitted.

## Project Structure

### Documentation (this feature)

```text
specs/017-exercise-erm-chart/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── exercise-erm-chart.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — not created here)
```

### Source Code Changes

```text
src/
└── routes/
    └── exercises/
        └── Exercise/
            └── ExerciseDetail/
                ├── hooks/
                │   └── useExerciseDetail.ts        MODIFY — add rawRows state
                └── views/
                    ├── ExerciseDetailView.tsx       MODIFY — render ExerciseErmChart
                    └── ExerciseErmChart/
                        └── index.tsx               NEW — chart + filter component

package.json                                        MODIFY — add @mui/x-charts
```

**No new routes, no new DB functions, no schema migrations.**

## Phase 0: Research

See [research.md](./research.md).

Key findings:
- `@mui/x-charts` `LineChart` handles sparse series via null values in parallel data arrays (default `connectNulls: false`).
- All required eRM data is already returned by `listWorkoutsByExerciseName`; no new query needed.
- Time-range filtering is client-side using ISO date string comparison — fast, no DB round-trip.
- Set numbers are DB-constrained to 1–5; chart has at most 5 series.

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/exercise-erm-chart.md](./contracts/exercise-erm-chart.md), [quickstart.md](./quickstart.md).

### Key design decisions

1. **No new DB function**: `listWorkoutsByExerciseName` already returns `Set1_erm … Set5_erm`. Only change to `useExerciseDetail` is adding `rawRows: WorkoutTableRow[]` state.

2. **Time-range filter state is internal to `ExerciseErmChart`**: It only affects chart display, not other parts of the page. Keeping it in the component avoids polluting the hook.

3. **Chart placement**: Between the exercise info header and the "History" divider in `ExerciseDetailView`. Keeps the history table below.

4. **Empty state**: Two variants — "no history at all" vs "no data in selected range".

5. **`ExerciseErmChart` file budget**: Component must stay under ~200 lines (Principle VIII). If it grows, extract `filterByRange` and `deriveChartSeries` into a co-located `ermChartUtils.ts`.

### Implementation sequence

1. `npm install @mui/x-charts`
2. Add `rawRows` + `setRawRows` to `useExerciseDetail`; populate in `loadHistory`.
3. Create `ExerciseErmChart/index.tsx`.
4. Wire into `ExerciseDetailView`.
5. `npm run typecheck && npm run lint` — fix any issues.
6. Manual smoke test in `npm run dev`.
