import { api } from './api';
import { configureStore } from '@reduxjs/toolkit';

/**
 * The Redux store holding the RTK Query cache. In-memory only — never persisted
 * (FR-008/FR-009). SQLite/OPFS remains the sole durable store; the cache is
 * discarded by the import/restore `location.reload()` (FR-010).
 */
export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
  reducer: {
    [api.reducerPath]: api.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
