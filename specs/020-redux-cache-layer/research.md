# Phase 0 Research: Redux Cache Layer

All Technical Context unknowns are resolved; the spec's clarifications fixed the three behavioral decisions.
This document records the remaining technical choices and their rationale.

## R1. RTK Query vs. plain RTK slices

- **Decision**: Use **RTK Query** (the data-fetching/caching layer built into `@reduxjs/toolkit`) with a
  custom `fakeBaseQuery` + per-endpoint `queryFn` that wraps the existing `@/database` helpers.
- **Rationale**: The spec describes a caching proxy with lazy loading, a per-data-set status flag
  (loading/loaded/empty/failed — FR-012), read-your-writes (FR-006), and change-driven invalidation
  (SC-004). RTK Query provides exactly this out of the box: subscription-based caching, automatic request
  dedup, `isLoading`/`isFetching`/`isError`/`data` status, and tag-based invalidation. Hand-rolling the same
  on plain slices means re-implementing status tracking, dedup, and invalidation — more code for the same
  result, against Principle V (simplicity through *less* code).
- **Alternatives considered**:
  - *Plain `createSlice` + `createEntityAdapter` + `createAsyncThunk`*: maximal control, but every entity
    needs a manual status reducer, a "have we loaded yet" guard, and bespoke cross-slice invalidation.
    Rejected for boilerplate.
  - *TanStack Query*: equally capable, but the user explicitly asked for **Redux** as the UI's datastore;
    RTK Query keeps the cache inside the Redux store, satisfying that requirement directly.

## R2. Bridging RTK Query to the local DB (no HTTP)

- **Decision**: Build the API with `fakeBaseQuery()` and implement each endpoint's `queryFn` to call a typed
  `@/database` helper, returning `{ data }` on success or `{ error }` on throw. No `baseUrl`, no `fetch`.
- **Rationale**: RTK Query's transport is pluggable; `queryFn` lets an endpoint run arbitrary async code.
  This keeps Constitution Principle II intact — the only thing the cache layer talks to is `@/database`,
  never the worker/`promiser`. Errors from helpers surface as RTK Query error state (FR-007/FR-012).
- **Shape**:
  ```ts
  // src/store/api.ts
  export const api = createApi({
    reducerPath: 'api',
    baseQuery: fakeBaseQuery<string>(),      // error type = string message
    tagTypes: ['Exercise', 'MuscleGroup', 'Routine', 'Workout', 'Draft', 'Settings'],
    keepUnusedDataFor: 60 * 60,              // ~1h: effectively "session" — survive navigation (R3)
    refetchOnMountOrArgChange: false,         // revisits are instant from cache (SC-001)
    endpoints: () => ({}),                    // entities inject via api.injectEndpoints
  });
  ```
  ```ts
  // a query endpoint
  listExercises: build.query<Exercise[], void>({
    queryFn: async () => {
      try { return { data: await listExercises() }; }
      catch (e) { return { error: 'Failed to load exercises' }; }
    },
    providesTags: ['Exercise'],
  }),
  ```

## R3. Lazy hydration + keeping the cache for the session (FR-002, SC-001, SC-004)

- **Decision**: Rely on RTK Query subscriptions for lazy load, set `keepUnusedDataFor` high (~3600s) and
  `refetchOnMountOrArgChange: false` globally.
- **Rationale**: A query endpoint fetches the first time a component subscribes (first page access → brief
  loading state, FR-002). When the user navigates away, the subscription drops but the cache entry is
  retained for `keepUnusedDataFor`; returning re-subscribes and renders cached data immediately with no
  refetch (SC-001). A long retention window makes the cache effectively session-scoped (SC-004 — "loaded at
  most once per session until it changes"). Default `refetchOnMountOrArgChange: false` prevents a revisit
  from silently re-querying.
- **Alternatives considered**: `keepUnusedDataFor: Infinity` is not supported (number required); a large
  finite value (1h) is more than enough for a gym session and still bounds memory. Prefetching all data at
  boot was rejected by the lazy-hydration clarification.

## R4. Write-through mutations + cross-view consistency (FR-004, FR-006, FR-013)

- **Decision**: Each create/update/delete is a `mutation` endpoint whose `queryFn` awaits the `@/database`
  write helper, then `invalidatesTags` for the affected entity. Invalidation triggers an automatic refetch
  of subscribed queries (and any read-only/analytics query sharing the tag).
- **Rationale**: This is write-through by construction — the cache is only refreshed *after* the durable
  write resolves (FR-004/FR-006). On helper failure the `queryFn` returns `{ error }`, no invalidation
  fires, and the cache is left untouched (FR-007); the caller surfaces the message. Tag invalidation
  propagates to every subscriber including analytics endpoints tagged with `Workout`/`Exercise`, giving
  FR-013 (derived views reflect edits) for free.
  - The automatic refetch is *not* an "explicit re-fetch" by the UI (FR-004) — it is RTK Query's own cache
    management, and it is the change-driven reload that SC-004 explicitly permits ("until it changes"). A
    local SQLite re-read is sub-millisecond, so no spinner appears on the already-mounted page.
  - *Optional optimization (deferred)*: pessimistic cache patching via `onQueryStarted` +
    `api.util.updateQueryData` to update in place without a re-read. Not needed for correctness; revisit only
    if a re-read proves visibly costly.
- **Alternatives considered**: Optimistic updates were rejected by the write-through clarification.

## R5. Store wiring & provider placement (Constitution II, VIII)

- **Decision**: Create the store once at module scope in `src/store/index.ts`
  (`configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: gDM => gDM().concat(api.middleware) })`),
  export `RootState`/`AppDispatch`, and wrap `<Provider store={store}>` around `<App/>` in `src/main.tsx`
  (outside `ThemeProvider`/`RouterProvider`). Add typed `useAppDispatch`/`useAppSelector` in
  `src/store/hooks.ts`. Optionally enable `setupListeners` (not required — no focus/online refetch needed
  for a local-first app).
- **Rationale**: One store instance mirrors the "single init" discipline. Provider at the root makes the
  cache available to all routes. Entities inject endpoints into the single `api` via `api.injectEndpoints`,
  keeping per-entity files small (Principle VIII) without multiple stores.

## R6. Database replacement / import invalidation (FR-010)

- **Decision**: Rely on the existing `replaceDatabaseAndReload` path, which calls `location.reload()`. A full
  reload destroys the in-memory store, so no stale entity can survive. Document that any *future* non-reload
  import must `dispatch(api.util.resetApiState())`.
- **Rationale**: FR-010 is satisfied for free today; adding reset logic now would be dead code against the
  current reload-based import. Recorded as a guard for future change.

## R7. Migration strategy (deferred item from /speckit.clarify)

- **Decision**: **Incremental, foundation-first.** Land the store/provider/api scaffolding once, then migrate
  container hooks entity-by-entity. Old direct-`@/database` hooks and new RTK Query hooks coexist during
  migration because both ultimately call the same `@/database` helpers — there is no flag day and no data
  divergence (the DB stays the single source of truth).
- **Rationale**: Keeps each step small and independently shippable/verifiable (matches the spec's
  independently-testable user stories). Avoids a risky big-bang rewrite of every hook at once.
- **Order**: exercises + muscle groups (simplest lists, highest revisit value) → workouts → routines +
  routine-exercises → draft → settings → analytics (last, validates FR-013 cross-tag invalidation).

## Dependencies to add

- `@reduxjs/toolkit` (^2.x) — provides `configureStore`, `createApi`, `fakeBaseQuery`.
- `react-redux` (^9.x) — `<Provider>` and typed hooks.

No build/config changes (Vite, COOP/COEP, optimizeDeps, service worker) are required — Redux is plain JS with
no worker or wasm involvement.
