# Research: Routine Inline Editing & UI Consistency

## R1 — Drag-and-drop library for exercise reordering

**Decision**: Use `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (the "react-dnd-kit"
the user referenced). Wrap the exercise cards in `DndContext` + `SortableContext`
(`verticalListSortingStrategy`); each card uses `useSortable`.

**Rationale**: `@dnd-kit` is the current best-maintained, accessibility- and touch-aware sortable
library for React; `react-beautiful-dnd` is deprecated. It is dependency-light, typed (Principle IX),
and works with MUI without wrappers.

**Mobile + form-input coexistence**: Cards contain text inputs and checkboxes, so the whole card must
not be draggable. Attach drag listeners to a dedicated **drag handle** only (a `DragIndicator` icon).
Configure sensors with an activation constraint so a tap/scroll on inputs never starts a drag:
- `PointerSensor` with `activationConstraint: { distance: 8 }`
- `TouchSensor` with `activationConstraint: { delay: 200, tolerance: 8 }`
Handle target ≥44px (Principle VI).

**Alternatives considered**: `react-beautiful-dnd` (deprecated, no React 18 strict-mode support),
native HTML5 DnD (poor touch support on mobile, the primary platform). Both rejected.

## R2 — Safe bulk position rewrite under `UNIQUE(routine_id, position)`

**Decision**: Add `reorder(routineId, orderedIds)` that, inside one `BEGIN/COMMIT` transaction,
(1) sets each row's `position = -(newIndex + 1)`, then (2) flips every negative back to positive
(`position = -position`). Both passes are parameterized.

**Rationale**: A single forward rewrite (`SET position = newIndex+1`) can transiently create a duplicate
position that the unique index rejects. Negative temporary positions never collide with the existing
positive values, so each statement is constraint-valid. This generalizes the existing single-step
`move()` swap to arbitrary reorders produced by DnD.

**Alternatives considered**: Repeated `move()` up/down calls per displaced item (O(n²) writes, awkward);
relying on a transient duplicate inside a transaction (unique index is not deferred — unreliable).

## R3 — Re-seeding react-hook-form after a structural edit

**Decision**: Keep `useForm` in the view, build defaultValues with a new pure
`buildFormValues(routine, draftData, prefills, exercises)`, and on each structural mutation call
`reset(buildFormValues(...))`. The container drives this via a `structureVersion` counter bumped after
every mutation; the view runs `reset(...)` in an effect keyed on that counter.

**Rationale**: After add/remove/reorder the exercise/set shape changes, so the simplest correct model
is to treat the form as a pure projection of (routine structure + draft). The draft is keyed by
`routineExerciseId` (not array index), so entered weight/reps/completion survive reordering and
set-count changes. Reusing the existing draft auto-save keeps a single source of truth for entered data.

**Ordering guarantee**: Each structural action first **awaits** a draft save of current form values
(`getValues()`), then mutates the template, then reloads + bumps version. Awaiting the draft write
before reload ensures `reset` rehydrates the latest typed values (the blur-time auto-save remains
fire-and-forget for the non-structural path).

**Alternatives considered**: Nested `useFieldArray` for exercises and sets with `append`/`remove`/`move`
(more code, must still reconcile with DB writes and prefills; error-prone for the green/gray derivations).
Rejected for complexity (Principle V/VIII).

## R4 — Reusing the existing exercise dialog for add + rep-range edit

**Decision**: Reuse `src/routes/routines/RoutineExerciseForm.tsx` (picker + sets + min/max reps) for
**add exercise** (create mode) and for the three-dots **edit** (edit mode, rep range primary). Reuse
`RoutineNameForm.tsx` for inline rename.

**Rationale**: These dialogs already exist, validate against the same 1–5 / 1–99 constraints, and use the
shared `ExercisePicker`. Reuse avoids near-duplicate forms (Principle V/VIII) and keeps the deleted
`RoutineEditor` folder's only valuable pieces in service.

**Alternatives considered**: A new minimal rep-range-only dialog. Rejected — `RoutineExerciseForm` edit
mode already covers it and is consistent with add.

## R5 — Single add-button pattern on the tabbed exercise library

**Decision**: Lift a single secondary `Fab` (`AddIcon`, `sx={{ bottom: 80, position: 'fixed', right: 24 }}`)
to the `ExerciseLibrary` container/view; its `onClick` dispatches to `exercises.openCreate` or
`muscleGroups.openCreate` based on the active `subView`. Remove the two top contained "Add …" buttons.

**Rationale**: Matches the existing log and routine-list FAB exactly (same color, position, icon), giving
one consistent add affordance. The container already holds both tab hooks, so switching the action by
active tab is trivial and keeps the dialogs co-located in their subviews.

**Alternatives considered**: Two FABs (cluttered), or a FAB per subview (duplicated styling, both mount).
Rejected.
