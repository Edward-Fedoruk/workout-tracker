# Implementation Plan: Exercise Detail Page

**Branch**: `015-exercise-detail-page` | **Date**: 2026-06-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/015-exercise-detail-page/spec.md`

## Summary

Add a dedicated exercise detail page at `/exercises/:id` that shows exercise attributes and full workout history for that exercise (via the existing `GroupedWorkoutTable`). Remove inline edit/delete buttons from the exercise library list — those actions move to a three-dots menu on the detail page. Make exercise names tappable from the routine editor to reach the same page. No schema migrations needed; only two new filtered read queries.

## Technical Context

**Language/Version**: TypeScript 5.x / React 18  
**Primary Dependencies**: React Router DOM (hash router), MUI v6, Drizzle ORM, material-react-table  
**Storage**: SQLite-WASM / OPFS (no schema changes)  
**Testing**: None (no test runner configured per Constitution Principle V)  
**Target Platform**: Browser PWA, mobile-first (≥320px)  
**Project Type**: Local-first SPA / PWA  
**Performance Goals**: Standard mobile web — all data is local SQLite, no network latency  
**Constraints**: Local-first, no backend; ~200-line file limit; `@/` imports only; 44×44px touch targets  
**Scale/Scope**: Single user, personal workout tracker

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Local-First | ✅ Pass | No backend, no new persistence layer |
| II. Single Worker, Single Init | ✅ Pass | All DB ops go through `database.ts` helpers |
| III. Schema-Complete Before Ready | ✅ Pass | No DDL changes; only new filtered read queries |
| IV. Parameterized SQL Only | ✅ Pass | New queries use `bind: [?]` placeholders |
| V. Simplicity | ✅ Pass | No test runner, no new abstraction layers |
| VI. Mobile-First | ✅ Pass | Detail page layout mobile-first; all touch targets ≥44px |
| VII. Component Separation | ✅ Pass | ExerciseDetail splits into container / hook / view |
| VIII. Code Organization | ✅ Pass | New component in `Exercise/ExerciseDetail/` with `index.tsx`, `hooks/`, `views/` |
| IX. Strong TypeScript | ✅ Pass | No `as any`; all new state typed |

## Project Structure

### Documentation (this feature)

```text
specs/015-exercise-detail-page/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── exercise-detail-page.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code Changes

```text
src/
  router.tsx                                        [modify]
  database.ts                                       [modify]

  db/entities/
    exercise/
      repository.ts                                 [modify: add getById]
    workout-log/
      repository.ts                                 [modify: add listByExerciseName]

  routes/
    exercises/
      Exercise/
        ExerciseDetail/                             [new]
          index.tsx                                 [new: container]
          hooks/
            useExerciseDetail.ts                    [new]
          views/
            ExerciseDetailView.tsx                  [new]
        ExerciseList/
          index.tsx                                 [modify: remove buttons, add onNavigate]
      ExerciseLibrary/
        hooks/
          useExercises.ts                           [modify: trim edit/delete state]
        views/
          ExercisesSubView.tsx                      [modify: wire navigation, remove ConfirmDialog]

    routines/
      ExerciseRow.tsx                               [modify: add optional onNavigateToExercise]
      RoutineEditor/
        views/
          RoutineEditorView.tsx                     [modify: wire navigation via libraryExercises lookup]

    workouts/
      GroupedWorkoutTable/
        index.tsx                                   [modify: make onDelete/onEdit optional]
```

**Structure Decision**: Single project, feature-grouped under existing domain folders. New `ExerciseDetail` component follows the established container/hooks/views pattern already used by `ExerciseLibrary`, `RoutineEditor`, and `RoutineWorkout`.

## Complexity Tracking

No constitution violations. No complexity justification needed.
