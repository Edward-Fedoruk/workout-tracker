---

description: "Task list for Combined Workout Set Column (weight × reps)"
---

# Tasks: Combined Workout Set Column (weight × reps)

**Input**: Design documents from `/specs/012-workout-set-combined-column/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/set-column-format.md

**Tests**: None — no test runner is configured (Constitution Principle V). Verification is manual via `npm run dev` + `npm run lint` + `npm run typecheck`.

**Organization**: Single user story (US1). All work is in one presentational file.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

No setup required — existing Vite/TS/React project, no new dependencies, no new files.

---

## Phase 2: Foundational

None — no shared infrastructure, schema, or data-layer change (UI-only per FR-004).

---

## Phase 3: User Story 1 - Read a set's weight and reps at a glance (Priority: P1) 🎯 MVP

**Goal**: Replace the per-set weight and reps columns with a single combined `S{n}` column showing `<weight>kg × <reps>`, keeping eRM separate and default visibility intact.

**Independent Test**: Open the workouts route with a set logged at weight 25 / reps 10 → it shows `25kg × 10` in one column; no standalone `S1 kg` / `S1 reps` columns; eRM still shown; Sets 2–5 hidden by default.

### Implementation for User Story 1

- [X] T001 [US1] Add pure `formatSetCell(weight, reps)` named export to `src/routes/workouts/WorkoutSetRow.tsx` per the truth table in data-model.md (both → `${weight}kg × ${reps}`; only weight → `${weight}kg`; only reps → `${reps}`; neither → `—`).
- [X] T002 [US1] In `buildSetColumns` (same file), replace the separate weight and reps column defs with one combined column (`id: Set{n}`, `header: S{n}`, `accessorFn` deriving from `Set{n}_weight`/`Set{n}_reps` via `formatSetCell`, using the existing typed-key pattern). Keep the eRM column unchanged.
- [X] T003 [US1] Update `HIDDEN_SET_COLUMNS` (same file) to hide Sets 2–5 via the new ids (`Set2`,`Set2_erm` … `Set5`,`Set5_erm`); remove the obsolete `Set{n}_weight`/`Set{n}_reps` keys.

**Checkpoint**: Combined column renders correctly; eRM intact; default visibility preserved.

---

## Phase N: Polish & Validation

- [X] T004 Run `npm run lint` and `npm run typecheck`; fix any issues.
- [ ] T005 Run quickstart.md manual verification (`npm run dev`).

---

## Dependencies & Execution Order

- T001 → T002 (T002 calls `formatSetCell`).
- T002 → T003 (T003 keys must match the ids T002 introduces).
- T004/T005 after T001–T003.
- All tasks touch a single file → strictly sequential, no `[P]`.

## Notes

- One file changed: `src/routes/workouts/WorkoutSetRow.tsx`. `WorkoutsView.tsx` and all DB code unchanged.
- No SQL/schema/migration (FR-004). No new dependencies. No casts (`as any`/`as unknown`) — Constitution IX.
