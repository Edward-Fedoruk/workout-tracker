# Implementation Plan: Date Group Rows in Workout Log

**Branch**: `014-date-group-rows` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/014-date-group-rows/spec.md`

## Summary

Insert non-interactive full-width date-divider rows between day groups in the workout log table, remove the standalone date column, and add an "Advanced view" toggle that disables grouping and exposes full MRT sorting/filtering. The date labels are locale-aware and computed client-side from `Intl.DateTimeFormat`; mode preference is persisted in the existing `app_setting` SQLite KV table under a new key. No schema migration is required.

## Technical Context

**Language/Version**: TypeScript 5 + React 18 (Vite 5 build)  
**Primary Dependencies**: MaterialReactTable v3 (MRT), MUI v6, Drizzle ORM, SQLite-WASM  
**Storage**: SQLite-WASM (OPFS). `app_setting` key-value table stores mode preference (`workout_view_mode` key). No migration needed — table already exists.  
**Testing**: None configured (Principle V — no test runner ad-hoc)  
**Target Platform**: Browser PWA, mobile-first (≥320px), offline-capable  
**Project Type**: Local-first single-page web application  
**Performance Goals**: Grouped rendering is a pure transform over an already-fetched in-memory array; no extra DB round-trip  
**Constraints**: Offline-capable, no backend, no second persistence layer, mobile-first

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | ✅ Pass | No backend. Mode preference goes into existing `app_setting` SQLite table — no new storage layer |
| II. Single Worker | ✅ Pass | No changes to `initDatabase` or worker initialization |
| III. Schema-Complete | ✅ Pass | No DDL changes; `app_setting` table already exists. A new repository method uses the existing schema |
| IV. Parameterized SQL | ✅ Pass | Any new `app_setting` queries follow existing parameterized pattern |
| V. Simplicity | ✅ Pass | No test runner, no extra abstraction layers; grouping is a pure array transform |
| VI. Mobile-First | ✅ Pass | Divider rows use `colSpan`; layout verified at ≥320px (see quickstart) |
| VII. Component Separation | ✅ Pass | Grouping logic in `dateGroupUtils.ts`; divider presentation in `DateGroupedTable/`; container in `hooks/useWorkouts.ts` |
| VIII. Code Organization | ✅ Pass | All files under ~200 lines; `@/` imports; each component in its own folder with `index.tsx` |
| IX. Strong TypeScript Types | ✅ Pass | `DateDividerRow` is a discriminated union type; no `as any` |

**No violations. No Complexity Tracking entries needed.**

## Project Structure

### Documentation (this feature)

```text
specs/014-date-group-rows/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── date-grouped-table.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/routes/workouts/
├── index.tsx                         # Container — unchanged entry point
├── hooks/
│   └── useWorkouts.ts                # Add: viewMode state + persist via app_setting
├── views/
│   └── WorkoutsView.tsx              # Modify: mode toggle UI, conditional rendering
├── DateGroupedTable/
│   └── index.tsx                     # New: grouped MUI Table with divider rows
├── dateGroupUtils.ts                 # New: pure utils — getDateLabel, groupWorkoutsByDate
├── WorkoutForm.tsx                   # Unchanged
├── WorkoutForm.schema.ts             # Unchanged
├── WorkoutSetRow.tsx                 # Unchanged
├── WorkoutSetInputRow.tsx            # Unchanged
├── WorkoutRowActions.tsx             # Unchanged
├── DeleteWorkoutDialog.tsx           # Unchanged
└── MigrationErrorDialog.tsx          # Unchanged

src/db/entities/app-setting/
└── repository.ts                     # Add: getWorkoutViewMode / setWorkoutViewMode
```

**Structure Decision**: Single project, feature-routed frontend. New components follow the `Entity/Component/index.tsx` convention from Principle VIII. The `dateGroupUtils.ts` utility stays co-located in `src/routes/workouts/` since it is workout-log-specific (not shared globally).
