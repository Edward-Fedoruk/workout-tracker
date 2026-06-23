# Implementation Plan: Redux Cache Layer

**Branch**: `020-redux-cache-layer` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-redux-cache-layer/spec.md`

## Summary

Insert a Redux Toolkit store between the React UI and the existing `database.ts` helpers so the UI reads
from an in-memory cache instead of re-querying SQLite on every navigation. The store is a **caching proxy**:
each data set loads lazily on first access, stays cached for the session, and serves subsequent reads
instantly (no spinner on revisit). Writes are **write-through** — a mutation awaits the existing
`database.ts` helper (the sole durable path to SQLite/OPFS), then the cache updates so every subscribed view
reflects the change without a manual re-fetch. SQLite remains the single source of truth; Redux holds nothing
that is not also durably stored and is discarded on the existing import/restore reload.

Technical approach: adopt **RTK Query** with a custom `queryFn`-based `fakeBaseQuery` that wraps the typed
async helpers already exported from `@/database`. Each entity gets `query` endpoints (lazy, cached for the
session via a large `keepUnusedDataFor` and `refetchOnMountOrArgChange: false`) and `mutation` endpoints that
call the write helpers and invalidate cache tags. Container hooks (e.g. `useExercises`, `useWorkouts`) are
re-pointed from local `useState`+`refresh()` to the generated query/mutation hooks while preserving their
return shape, so presentational components and route layouts are untouched.

## Technical Context

**Language/Version**: TypeScript 5.5, React 18.3 (strict mode)
**Primary Dependencies**: Redux Toolkit `@reduxjs/toolkit` ^2 (RTK Query) + `react-redux` ^9 (new); existing
MUI 9, react-router-dom 7, react-hook-form 7, zod 4, drizzle-orm 0.45, `@sqlite.org/sqlite-wasm`.
**Storage**: Unchanged — SQLite-WASM persisted to OPFS (in-memory fallback) via the single worker in
`src/db/driver.ts`. Redux is **in-memory cache only**, never persisted (no `redux-persist`, no localStorage/
IndexedDB).
**Testing**: None configured (Constitution Principle V). Verification is manual via `npm run preview`.
**Target Platform**: Browser PWA, cross-origin-isolated; mobile-first (≥320px).
**Project Type**: Single-project SPA (`src/`), client-only.
**Performance Goals**: Revisit to an already-cached page renders with no loading indicator, perceived
<100 ms (SC-001); each data set loaded at most once per session until it changes (SC-004).
**Constraints**: Fully offline (FR-011); read-your-writes consistency (FR-006); cache never durable, never a
second persistence layer (FR-008/FR-009); all DB access continues to flow through `@/database` helpers only
(Constitution Principle II).
**Scale/Scope**: ~7 data sets (exercises, muscle groups, routines+routine-exercises, workouts, draft,
settings, analytics-derived). Single-user, single-tab (cross-tab sync out of scope per Clarifications).

No outstanding NEEDS CLARIFICATION — the spec's three clarifications (write-through, lazy hydration,
single-tab) are resolved and drive the design above.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First (NON-NEGOTIABLE) | ✅ Pass | Redux is in-memory only; SQLite/OPFS stays the sole durable store. No new client persistence layer — the store is explicitly **not** persisted. |
| II. Single Worker, Single Init (NON-NEGOTIABLE) | ✅ Pass | RTK Query endpoints call typed `@/database` helpers exclusively. No endpoint, thunk, or middleware imports `@sqlite.org/sqlite-wasm` or touches the `promiser`/`dbId`. |
| III. Schema-Complete Before Ready | ✅ Pass (N/A) | Read-only over existing tables; zero schema/migration change. |
| IV. Parameterized SQL Only | ✅ Pass (N/A) | No new SQL; existing parameterized helpers reused. |
| V. Simplicity & Explicit Scope | ⚠️ Justified | Adds a new dependency + abstraction (Redux Toolkit). Explicitly requested by the user and central to the feature goal. Not forbidden scope (no tests/auth/sync/backend/SSR). See Complexity Tracking. |
| VI. Mobile-First, Adaptive UI | ✅ Pass | No layout change; only removal of redundant loading states. Existing responsive components unchanged. |
| VII. Component Separation of Concerns | ✅ Pass (improved) | Container hooks stay the data/logic layer but get thinner (selectors/mutations replace manual fetch+state). Presentational components untouched. |
| VIII. Code Organization & File Size | ✅ Pass | New code grouped by entity under `src/store/`; files <200 lines; `@/` alias for all cross-dir imports. `src/store/index.ts` and `src/store/api.ts` are store **config**, not re-export barrels. |
| IX. Strong TypeScript Types | ✅ Pass | RTK Query is fully typed; typed `RootState`/`AppDispatch` and `useAppSelector`/`useAppDispatch`. No `as any`/`as unknown`. Endpoint result/arg types derive from `@/database` helper signatures. |

**Gate result**: PASS (one justified deviation under Principle V, recorded in Complexity Tracking). No
unjustified violations — proceed to Phase 0.

### Post-Design Re-check (after Phase 1)

Re-evaluated after data-model + contracts: design keeps all DB access behind `@/database`, introduces no
persistence, no schema change, and no new SQL. The Principle V deviation is unchanged and remains justified.
**Post-design gate: PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/020-redux-cache-layer/
├── plan.md              # This file (/speckit.plan)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (cache-state model)
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── store-api.md     # RTK Query endpoint contracts (queries/mutations/tags)
│   └── ui-hooks.md      # Container-hook migration contract (preserved return shapes)
└── checklists/
    └── requirements.md  # From /speckit.specify + /speckit.clarify
```

### Source Code (repository root)

```text
src/
├── main.tsx                      # MODIFIED: wrap <Provider store={store}> at the root
├── database.ts                   # UNCHANGED: still the only DB access barrel
├── db/                           # UNCHANGED: driver, entities, repositories, migrations
├── store/                        # NEW: the Redux cache layer
│   ├── index.ts                  #   configureStore + RootState/AppDispatch types
│   ├── api.ts                    #   createApi(fakeBaseQuery) + tagTypes; injection root
│   ├── hooks.ts                  #   typed useAppDispatch / useAppSelector
│   └── entities/                 #   endpoints grouped by domain entity (injectEndpoints)
│       ├── exercises.ts          #     list/get/create/update/delete + tags
│       ├── muscleGroups.ts
│       ├── routines.ts           #     routines + routine-exercises endpoints
│       ├── workouts.ts
│       ├── draft.ts              #     save/get/clear active workout draft
│       ├── settings.ts           #     body weight + display prefs
│       └── analytics.ts          #     read-only; shares Workout/Exercise tags (FR-013)
└── routes/                       # MODIFIED: container hooks re-pointed to store hooks
    ├── exercises/.../hooks/useExercises.ts        # uses useListExercisesQuery + mutations
    ├── workouts/hooks/useWorkouts.ts
    ├── routines/RoutineList/hooks/useRoutines.ts
    └── ... (remaining container hooks, migrated incrementally)
```

**Structure Decision**: Single-project SPA. The cache layer lives in a new `src/store/` tree grouped by
entity (mirroring `src/db/entities/`), per Constitution Principle VIII. `src/store/api.ts` and
`src/store/index.ts` are configuration modules (allowed), not trivial re-export barrels. The existing
`database.ts` barrel and `src/db/` repositories are untouched — the store sits in front of them. UI changes
are confined to container hooks under `src/routes/**/hooks/`; presentational components and route layouts are
not modified.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency + abstraction: Redux Toolkit / RTK Query (Principle V — Simplicity) | Explicitly requested by the user; the feature *is* "make Redux the UI's datastore / caching proxy." A centralized, normalized, session-scoped cache with lazy load, tag invalidation, and read-your-writes is what eliminates re-fetch-on-navigation (SC-001/SC-004). | (a) Ad-hoc per-hook `useState` caching (status quo) — re-fetches on every mount, the exact problem. (b) React Context cache — hand-rolled invalidation, status tracking, and dedup re-implements RTK Query poorly. (c) TanStack Query — viable, but the user specifically asked for Redux as the main datastore; RTK Query keeps the cache *in* the Redux store. (d) Plain RTK slices + entityAdapter + thunks — more boilerplate (manual status flags, dedup, invalidation) for the same outcome; RTK Query encapsulates the lazy/cached/invalidate contract this spec describes. |
