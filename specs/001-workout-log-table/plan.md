# Implementation Plan: Workout Log Table

**Branch**: `001-workout-log-table` | **Date**: 2026-05-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-workout-log-table/spec.md`

## Summary

Create a responsive workout logging table in the React PWA that persists workout data (exercise name, date, up to 5 sets with weight/reps) to SQLite-WASM via OPFS. Table displays workouts in separate columns per set (Set1_weight, Set1_reps, ..., Set5_weight, Set5_reps), sorted most-recent-first, with validation enforcing at least 1 set per workout and past/current dates only. All data access goes through existing `src/database.ts` helpers; no new persistence layer.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: React, Vite, SQLite-WASM (`@sqlite.org/sqlite-wasm`), Chakra UI (or similar responsive UI lib)  
**Storage**: SQLite-WASM persisted to OPFS (browser local storage), in-memory fallback  
**Testing**: Not configured (per Constitution Principle V — do not add ad-hoc)  
**Target Platform**: Web — modern browsers with OPFS support (Chrome 90+, Firefox 110+, Safari 15.1+)  
**Project Type**: Progressive Web App (PWA)  
**Performance Goals**: Users log a complete workout (exercise, date, 1-5 sets) in under 2 minutes  
**Constraints**: Mobile-responsive (≥320px viewport), offline-capable, local-first only (no backend), parameterized SQL only  
**Scale/Scope**: Single-user per browser; 20+ historical workouts without performance degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Local-First** | ✅ PASS | All workout data persists to SQLite-WASM via OPFS; no backend or remote sync. |
| **II. Single Worker, Single Init** | ✅ PASS | Will add `workout_log` table inside existing `initDatabase()` in `src/database.ts`; reuse memoized `dbPromise`. |
| **III. Schema-Complete Before Ready** | ✅ PASS | `CREATE TABLE workout_log` runs inside `initDatabase()` before promise resolves; UI gates on `isDbReady`. |
| **IV. Parameterized SQL Only** | ✅ PASS | All queries use bind arrays with `?` placeholders; export typed helpers from `database.ts` (e.g., `createWorkout()`, `listWorkouts()`). |
| **V. Simplicity & Explicit Scope** | ✅ PASS | No tests, auth, or abstractions beyond table CRUD; scope is bounded to logging + viewing + editing workouts. |
| **VI. Mobile-First, Adaptive UI** | ✅ PASS | Table layout uses responsive CSS (flex/grid); touch targets ≥44×44px; tested at ≥320px viewport. No fixed widths or desktop-only assumptions. |

**Gate Result**: ✅ PASS — No constitution violations. Feature is compliant across all six principles.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── database.ts                          # Database setup & helpers (existing; add workout_log table + helpers here)
├── components/
│   ├── WorkoutTable.tsx                 # Main table display (NEW)
│   ├── WorkoutForm.tsx                  # Add/edit workout modal/form (NEW)
│   └── [other existing components]
├── App.tsx                              # Main app (update to include WorkoutTable)
├── index.css                            # Global styles
└── [other existing files]

public/
├── index.html
└── [PWA manifest, favicon, etc.]
```

**Structure Decision**: Single project (React PWA). The feature is isolated to:
1. **Database layer** (`src/database.ts`): Add `workout_log` table schema + typed query helpers
2. **UI layer** (`src/components/`): Add `WorkoutTable.tsx` (read/display) and `WorkoutForm.tsx` (create/edit)
3. **Integration** (`src/App.tsx`): Mount table in main app after `isDbReady` gate

No new directories; follows existing single-project structure. Tests are not configured (per Principle V).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
