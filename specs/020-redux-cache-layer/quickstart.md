# Quickstart: Redux Cache Layer

How to build and verify the cache layer. Foundation first, then migrate hooks entity-by-entity (R7).

## 0. Install dependencies

```bash
npm install @reduxjs/toolkit react-redux
```

No Vite/PWA/COOP-COEP config changes are needed.

## 1. Foundation (one-time)

Create the store scaffolding under `src/store/`:

1. `src/store/api.ts` — `createApi` with `fakeBaseQuery<string>()`, `tagTypes`, `keepUnusedDataFor: 3600`,
   `refetchOnMountOrArgChange: false`, empty `endpoints`. (See `contracts/store-api.md`.)
2. `src/store/index.ts` — `configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: gDM =>
   gDM().concat(api.middleware) })`; export `type RootState = ReturnType<typeof store.getState>` and
   `type AppDispatch = typeof store.dispatch`.
3. `src/store/hooks.ts` — typed `useAppDispatch` / `useAppSelector`.
4. `src/main.tsx` — wrap the root:
   ```tsx
   import { Provider } from 'react-redux';
   import { store } from '@/store';
   // ...
   <Provider store={store}><App /></Provider>
   ```

Run `npm run typecheck && npm run lint` — both must pass (Constitution).

## 2. Per-entity endpoints

For each entity (order: exercises → muscle groups → workouts → routines → draft → settings → analytics),
add `src/store/entities/<entity>.ts` that does `api.injectEndpoints({ endpoints: build => ({ ... }) })`,
following `contracts/store-api.md` (query + mutation endpoints, tags, INV-1..4). Keep each file <200 lines.

Each `queryFn`/mutation wraps the matching `@/database` helper:

```ts
// src/store/entities/exercises.ts
import { api } from '@/store/api';
import { listExercises, createExercise } from '@/database';

export const exercisesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listExercises: build.query({
      queryFn: async () => {
        try { return { data: await listExercises() }; }
        catch { return { error: 'Failed to load exercises' }; }
      },
      providesTags: ['Exercise'],
    }),
    createExercise: build.mutation({
      queryFn: async (args) => {
        try { return { data: await createExercise(args.name, args.muscleGroupIds, args.classification, args.imageFilename ?? null) }; }
        catch { return { error: 'Failed to save exercise' }; }
      },
      invalidatesTags: ['Exercise'],
    }),
  }),
});
export const { useListExercisesQuery, useCreateExerciseMutation } = exercisesApi;
```

## 3. Migrate the container hook

Re-point the entity's container hook to the generated hooks, preserving its return shape
(`contracts/ui-hooks.md`). The view file should not change.

## 4. Verify each entity (manual — no test runner)

Use `npm run preview` (the SW/PWA path; dev does not register the SW):

- **Instant revisit (SC-001)**: open the entity's page, navigate away, return → no spinner, data immediate.
- **Load-once (SC-004)**: open Redux DevTools (or a temporary `console.count` in the wrapped helper) → the
  list `queryFn` runs once per session despite repeated navigation.
- **Read-your-writes (FR-006)**: create/edit/delete → the change shows immediately in every view of that
  data, including analytics for logging edits (FR-013).
- **Write-through failure (FR-007/SC-006)**: force a helper to throw (temporary) → UI shows "not saved",
  cache unchanged, reload shows pre-edit state.
- **Offline (FR-011)**: throttle to offline → reads and edits still work.
- **DB import (FR-010)**: Settings → import a different DB → app reloads → no stale entity from the old DB.

## 5. Definition of done

- All container hooks listed in `contracts/ui-hooks.md` migrated; no view file reads cached data via
  `@/database` directly (HR-6), except the documented `getLastExerciseSets` exception.
- `npm run lint` and `npm run typecheck` pass; no `as any`/`as unknown` (Constitution IX).
- Manual checks in §4 pass for every entity.
- The store is never persisted; SQLite/OPFS remains the only durable store.
