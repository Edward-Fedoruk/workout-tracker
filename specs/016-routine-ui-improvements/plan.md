# Implementation Plan: Routine UI Improvements

**Branch**: `016-routine-ui-improvements` | **Date**: 2026-06-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/016-routine-ui-improvements/spec.md`

## Summary

Polish and extend the Routine List page and Routine Workout view: replace text set labels with `Looks*` numbered icons, add exercise avatars to workout headers, change weight label to "kg", prefill inputs with real values from the last workout (with per-position fallback), add per-set completion checkboxes that gate the Log Workout button and persist to the draft, move Edit/Delete from list cards to a three-dots menu in the RoutineEditor header, replace the Add button with a FAB, and show exercise name chips instead of a count chip on each routine card.

## Technical Context

**Language/Version**: TypeScript 5 / React 19  
**Primary Dependencies**: MUI v7, React Hook Form, Zod, Drizzle ORM, SQLite-WASM  
**Storage**: SQLite-WASM via OPFS (routine_workout_draft JSON column for draft state)  
**Testing**: None configured (Principle V)  
**Target Platform**: Browser (mobile-first PWA, cross-origin-isolated)  
**Project Type**: Local-first PWA  
**Performance Goals**: Interactive at 60 fps on mobile; no new async DB calls on hot path  
**Constraints**: Offline-capable; no backend; OPFS requires cross-origin isolation headers  
**Scale/Scope**: Single-user, single-device; draft is a singleton row

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | ✅ Pass | No backend or second persistence layer introduced |
| II. Single Worker / Single Init | ✅ Pass | All new DB access goes through existing typed helpers in `database.ts` |
| III. Schema-Complete Before Ready | ✅ Pass | No DDL changes; `StoredSetValues` type change is JSON-only, no migration needed |
| IV. Parameterised SQL Only | ✅ Pass | New fallback query uses `bind` array with `?` placeholders |
| V. Simplicity & Explicit Scope | ✅ Pass | No tests, no new abstractions; feature-only changes |
| VI. Mobile-First | ✅ Pass | Checkbox target ≥44px, exercise chips wrap, FAB follows existing positioning |
| VII. Component Separation | ✅ Pass | Logic stays in hooks; views receive only props |
| VIII. Code Organisation | ✅ Pass | All new code in existing files/folders; no new folders needed |
| IX. Strong TypeScript Types | ✅ Pass | `completed?: boolean` is correctly typed; no `any` casts |

**Gate result**: PASS — proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/016-routine-ui-improvements/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── routine-ui-improvements.md
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (files changed)

```text
src/
├── db/
│   └── entities/
│       ├── routine-exercise/
│       │   └── repository.ts          ← getLastSets fallback logic
│       └── routine-workout-draft/
│           └── types.ts               ← StoredSetValues + completed field
├── routes/
│   └── routines/
│       ├── RoutineCard.tsx            ← exercise chips, Start button, no Edit/Delete
│       ├── RoutineList/
│       │   ├── hooks/useRoutines.ts   ← remove delete logic (moved to editor)
│       │   └── views/RoutineListView.tsx ← FAB, h6 title, no Add button
│       ├── RoutineEditor/
│       │   ├── hooks/useRoutineEditor.ts ← add delete + name-edit handlers
│       │   └── views/RoutineEditorView.tsx ← three-dots menu
│       └── RoutineWorkout/
│           ├── RoutineWorkoutForm.schema.ts ← completed field
│           ├── hooks/useRoutineWorkout.ts   ← prefill + autoSave completed
│           └── views/
│               ├── RoutineWorkoutExercise.tsx ← avatar, icons, label, checkbox
│               └── RoutineWorkoutView.tsx     ← allSetsCompleted gate
```

## Complexity Tracking

No constitution violations. No complexity entries needed.
