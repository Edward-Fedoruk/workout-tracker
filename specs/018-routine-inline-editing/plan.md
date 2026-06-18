# Implementation Plan: Routine Inline Editing & UI Consistency

**Branch**: `018-routine-inline-editing` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-routine-inline-editing/spec.md`

## Summary

Collapse the separate routine editor into the in-progress workout view so a single screen
both logs sets and edits the routine structure. Structural edits (rename, add/delete
exercise, add/remove set, edit rep range, reorder) write directly to the routine template
in SQLite via `database.ts` helpers; entered set values continue to live in the singleton
draft. The view re-projects from (routine structure + draft) after each structural edit.
Add drag-and-drop reordering with `@dnd-kit`, wrap each exercise in a card (green when all
its sets complete, alternating gray set rows), and standardize the "add" action on the
exercise library to the same plus FAB used on the log and routine screens.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: MUI (`@mui/material`, `@mui/icons-material`), react-hook-form + zod,
react-router-dom (hash router), Drizzle ORM over `@sqlite.org/sqlite-wasm`. **New**: `@dnd-kit/core`,
`@dnd-kit/sortable`, `@dnd-kit/utilities`.
**Storage**: SQLite-WASM persisted to OPFS (in-memory fallback). No schema change required.
**Testing**: None configured (Principle V); not added.
**Target Platform**: Browser PWA, mobile-first (≥320px), cross-origin-isolated.
**Project Type**: Single-project front-end (local-first PWA).
**Performance Goals**: 60fps interactions; structural edit re-render within one frame budget on a phone.
**Constraints**: Offline-capable; all DB access through `database.ts`; parameterized SQL only;
touch targets ≥44px; DnD must work with touch.
**Scale/Scope**: Single user, dozens of routines, ≤ ~30 exercises/routine, 1–5 sets/exercise.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | PASS | All edits persist through new/existing `database.ts` helpers; no new persistence layer. |
| II. Single Worker / Single Init | PASS | No change to `initDatabase`/promiser; new repo methods reuse `getPromiser()`/`getDatabaseId()`. |
| III. Schema-Complete Before Ready | PASS | **No schema change.** Set count stays 1–5, reps 1–99, ordering uses existing `position`. No DDL added. |
| IV. Parameterized SQL Only | PASS | New `reorder` helper uses `?` bind arrays, like existing `move`/`delete`. |
| V. Simplicity & Explicit Scope | PASS | One new dep (`@dnd-kit`) is a direct user requirement. No tests/sync/backend added. |
| VI. Mobile-First, Adaptive UI | PASS | DnD via pointer/touch sensors + drag handle; controls ≥44px; verify at 320px. |
| VII. Component Separation | PASS | Container/hooks own DB + state; presentational cards receive props/callbacks. |
| VIII. Code Organization & File Size | PASS | New components get own folders + `index.tsx`; structural logic split into a dedicated hook; form-seeding extracted to a pure util to keep files ≤~200 lines. `@/` imports only. |
| IX. Strong TypeScript Types | PASS | No `any`/double-cast; `@dnd-kit` ships types. |

No violations → Complexity Tracking omitted.

## Project Structure

### Documentation (this feature)

```text
specs/018-routine-inline-editing/
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (DB helper + component contracts)
└── checklists/
    └── requirements.md  # from /speckit.specify
```

### Source Code (repository root)

```text
src/
├── router.tsx                                    # MODIFY: drop /routines/new & /:id/edit; merged view at /routines/:id
├── database.ts                                   # MODIFY: export reorderRoutineExercises, setRoutineExerciseSetCount
├── db/entities/routine-exercise/repository.ts    # MODIFY: add reorder() + updateSetCount()
├── routes/routines/
│   ├── RoutineExerciseForm.tsx                   # REUSE (add + edit-rep-range dialog)
│   ├── RoutineNameForm.tsx                       # REUSE (inline rename dialog)
│   ├── routineUtilities.ts                       # MODIFY: add buildRoutineFormValues() pure util
│   ├── RoutineEditor/                            # DELETE (folder removed; replaced by merged view)
│   ├── ExerciseRow.tsx                           # DELETE (arrow-reorder row obsolete)
│   ├── RoutineCard.tsx                           # MODIFY: row tap = open merged view; add three-dots Delete
│   ├── RoutineList/
│   │   ├── index.tsx                             # MODIFY: + creates routine then navigates to merged view
│   │   ├── hooks/useRoutines.ts                  # MODIFY: add create + delete actions
│   │   └── views/RoutineListView.tsx            # MODIFY: onAdd → create+open; onOpen; row delete
│   └── RoutineWorkout/                           # the merged view
│       ├── index.tsx                            # MODIFY: wire structural callbacks, reload-on-mutate
│       ├── hooks/useRoutineWorkout.ts          # MODIFY: expose reload + awaitable autosave
│       ├── hooks/useRoutineStructure.ts        # NEW: add/delete exercise, add/remove set, reorder, rename
│       ├── buildFormValues.ts                  # NEW: pure form-seeding util (extracted from view)
│       └── views/
│           ├── RoutineWorkoutView.tsx          # MODIFY: DndContext, rename header, add-exercise, reset-on-version
│           ├── RoutineExerciseCard/index.tsx   # NEW: card wrapper (sortable, three-dots, green/gray, set buttons)
│           └── RoutineWorkoutSetRow.tsx        # NEW: extracted set row (alternating gray + completed tint)
└── routes/exercises/ExerciseLibrary/
    ├── index.tsx                                # MODIFY: pass onAdd to view (switches by active tab)
    └── views/
        ├── ExerciseLibraryView.tsx             # MODIFY: render shared add FAB
        ├── ExercisesSubView.tsx                # MODIFY: remove top "Add exercise" button
        └── MuscleGroupsSubView.tsx             # MODIFY: remove top "Add muscle group" button
```

**Structure Decision**: Keep the existing route folder organization (container `index.tsx` +
`hooks/` + `views/`). The merged view stays in `RoutineWorkout/`; structural editing is a new
sibling hook so neither hook nor view exceeds the ~200-line soft limit (Principle VIII).

## Key design decisions

1. **The merged view is a projection of (routine structure + draft).** `useForm` defaultValues are
   built by a new pure `buildFormValues(routine, draftData, prefills, exercises)`. After any
   structural mutation the routine is reloaded and the form is `reset()` with freshly built values.
2. **Edit → autosave → mutate → reload → reset.** Every structural action first awaits a draft save
   of the current form values (keyed by `routineExerciseId`, the existing draft contract), then writes
   to the routine template, reloads via `getRoutineById`, and bumps a `structureVersion` counter the
   view watches to `reset()`. This preserves all entered weight/reps/completion across add/remove/reorder
   because the draft is keyed by exercise id, not array index.
3. **No schema change.** Add-set/remove-set adjust `suggested_sets` (clamped 1–5). Rep range edits
   reuse `updateRoutineExercise`. Reorder rewrites `position`.
4. **Bulk reorder helper.** New `reorder(routineId, orderedIds)` rewrites positions safely under the
   `UNIQUE(routine_id, position)` index using a two-pass negative-offset (set each to `-(index+1)`, then
   flip to positive) inside `BEGIN/COMMIT` — avoids transient duplicate-position collisions.
5. **Three-dots per exercise** opens `RoutineExerciseForm` in edit mode (rep range is the primary field;
   reuses existing code) and offers Delete (with confirm). **Add/remove set** are outlined buttons under
   the sets. **Rename** uses a pencil affordance in the header opening the existing `RoutineNameForm`.
6. **Cards & feedback.** `RoutineExerciseCard` wraps each exercise in an MUI `Card`. `allCompleted`
   (derived from watched set values) → green card. Set rows alternate `action.hover`-style gray; a
   completed row keeps its existing green tint.
7. **DnD.** `DndContext` + `SortableContext` (vertical strategy) around the cards; each card is
   `useSortable` with a dedicated drag handle (so inputs stay usable). `PointerSensor` +
   `TouchSensor` with an activation constraint for mobile. `onDragEnd` → `arrayMove` → reorder helper.
8. **Single routine entry point.** Routine list row tap → `/routines/:id` (merged view). Routine delete
   moves to a three-dots menu on the list row. `+` creates a routine (default name) and navigates in.

## Phase 0 — research

See [research.md](./research.md). Resolves: @dnd-kit on mobile with form inputs; safe bulk
position rewrite under the unique index; RHF re-seeding strategy after structural edits.

## Phase 1 — design & contracts

- [data-model.md](./data-model.md): entities touched (no schema change), invariants for set count,
  rep range, and contiguous positions.
- [contracts/](./contracts/): new/changed `database.ts` helper signatures and the component
  prop/callback contracts for the merged view and cards.
- [quickstart.md](./quickstart.md): step-by-step build & manual verification.
- Agent context: update the plan reference inside the `<!-- SPECKIT ... -->` markers in `CLAUDE.md`.

## Phase 2 — tasks

Generated by `/speckit.tasks` (not part of this command).
