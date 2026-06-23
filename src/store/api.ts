import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * The single RTK Query api. Endpoints are injected per entity via
 * `api.injectEndpoints` (see `src/store/entities/*`). Every endpoint's
 * `queryFn` wraps a typed `@/database` helper — no endpoint ever touches the
 * SQLite worker / promiser directly (Constitution II, INV-1).
 *
 * The cache is the UI's in-memory read store: `keepUnusedDataFor` keeps data for
 * the session so revisits are instant (SC-001/SC-004), and
 * `refetchOnMountOrArgChange: false` means a cached page never re-reads SQLite
 * on navigation. Write-through happens via tag invalidation on mutations.
 */
export const api = createApi({
  baseQuery: fakeBaseQuery<string>(),
  endpoints: () => ({}),
  keepUnusedDataFor: 3_600,
  reducerPath: 'api',
  refetchOnMountOrArgChange: false,
  tagTypes: [
    'Exercise',
    'MuscleGroup',
    'Routine',
    'Workout',
    'Draft',
    'Settings',
  ],
});
