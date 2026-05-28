# Implementation Plan: Rep Range for Routine Exercises

**Branch**: `006-reps-range` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/006-reps-range/spec.md`

## Summary

Replace the single `suggested_reps` field on routine exercises with a `min_reps` / `max_reps` pair. Users can define a rep range (e.g., 8–12) or a fixed target (e.g., 5–5, displayed as "5 reps"). The change requires one additive+destructive forward migration, updated Drizzle schema, updated DB helper signatures, updated form validation, and updated display in the routine editor, routine list, and workout entry form.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: React 18, Material UI v6, Drizzle ORM, `@sqlite.org/sqlite-wasm`  
**Storage**: SQLite-WASM via OPFS (local-first; in-memory fallback)  
**Testing**: None configured (per constitution Principle V)  
**Target Platform**: PWA, mobile-first (≥320px), browser-only  
**Project Type**: Local-first PWA  
**Performance Goals**: Standard interactive UI; no special throughput targets  
**Constraints**: No backend; all data in OPFS; schema migrations must run inside the migration runner; `tsc -b` + ESLint must pass before commit

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Local-First | ✅ Pass | Pure schema + UI change; no network or new storage layer |
| II. Single Worker, Single Init | ✅ Pass | No changes to `initDatabase` or worker init path |
| III. Schema-Complete Before Ready | ✅ Pass | Migration added as a new Drizzle SQL file; runs via migration runner before app is ready |
| IV. Parameterized SQL Only | ✅ Pass | All SQL uses `?` placeholders via Drizzle ORM |
| V. Simplicity & Explicit Scope | ✅ Pass | No abstractions beyond what's needed; no test runner added |
| VI. Mobile-First UI | ✅ Pass | Two side-by-side TextFields in the dialog; same responsive pattern as the existing sets/reps row |
| VII. Component Separation | ✅ Pass | Validation and formatting logic stay in `routineUtilities.ts`; components stay presentational for display, container for editor |
| VIII. File Size | ✅ Pass | No files expected to approach 200 lines; `RoutineEditor.tsx` is currently 379 lines and will not grow materially |
| IX. Strong TypeScript Types | ✅ Pass | Type inferred from schema; no `any` casts introduced |

## Project Structure

### Documentation (this feature)

```text
specs/006-reps-range/
├── plan.md              # This file
├── research.md          # Phase 0 — migration strategy, type decisions
├── data-model.md        # Phase 1 — schema before/after, migration steps
├── quickstart.md        # Phase 1 — step-by-step implementation guide
├── contracts/
│   └── routineHelpers.ts.md   # Changed helper signatures + new utilities
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (files to change)

```text
src/db/
├── schema.ts                  # Remove suggestedReps, add minReps/maxReps
└── routineHelpers.ts          # Update addRoutineExercise, updateRoutineExercise signatures

drizzle/
└── 0004_*.sql                 # New Drizzle-generated migration (manually augmented)

src/components/routines/
├── routineUtilities.ts        # Update validateExercise; add formatRepRange
├── RoutineEditor.tsx          # Replace single reps field with minReps + maxReps fields
├── ExerciseRow.tsx            # Update display format
└── RoutineWorkoutExercise.tsx # Update guidance label
```

**Structure Decision**: Single project; all changes within existing `src/` and `drizzle/` trees. No new directories needed.
