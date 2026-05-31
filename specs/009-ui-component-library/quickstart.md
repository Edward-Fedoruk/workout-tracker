# Quickstart: Shared UI Component Library & URL Routing

## Prerequisites

- Node.js ≥ 18
- `npm install` run at repo root

## Install the new dependency

```bash
npm install react-router-dom
```

## Run dev server

```bash
npm run dev
```

The app opens at `http://localhost:5173/workout-tracker/`. React Router will serve routes from the `/workout-tracker` base.

> **Note**: The service worker is not registered in dev mode. To test PWA offline behaviour run `npm run build && npm run preview`.

## Verify routing works

After the refactor, test these navigation paths manually:

1. Open `http://localhost:5173/workout-tracker/log` → Workout Log loads.
2. Open `http://localhost:5173/workout-tracker/routines` → Routine List loads.
3. Click "Add Routine" → URL changes to `/workout-tracker/routines/new`; tab bar hidden.
4. Press browser back → returns to `/workout-tracker/routines`.
5. Click a routine's edit → URL changes to `/workout-tracker/routines/:id/edit`.
6. Open `http://localhost:5173/workout-tracker/unknown` → redirects to `/workout-tracker/log`.
7. Open `http://localhost:5173/workout-tracker/routines/99999/edit` → redirects to `/workout-tracker/routines` (routine not found).

## Verify shared dialogs

1. Open the Exercises tab → click the trash/edit icon on any exercise → dialog uses `FormDialog`.
2. Go to Settings → trigger Import → `ConfirmImportDialog` uses `ConfirmDialog`.
3. Go to Workout Log → delete a workout → `DeleteWorkoutDialog` uses `ConfirmDialog`.
4. Go to Routines → delete a routine → inline delete uses `ConfirmDialog`.

## Lint and typecheck

```bash
npm run check
```

Both `typecheck` and `lint` must pass before committing. A pre-commit hook enforces this.

## Key files changed by this feature

| File | Change |
|---|---|
| `src/router.tsx` | New — `createBrowserRouter` definition |
| `src/AppLayout.tsx` | New — DB gate + tab bar + Outlet |
| `src/App.tsx` | Simplified — wraps `<RouterProvider router={router} />` inside `<ThemeProvider>` |
| `src/components/ui/ConfirmDialog.tsx` | New |
| `src/components/ui/FormDialog.tsx` | New |
| `src/components/ui/DialogActionButtons.tsx` | New |
| `src/components/ui/index.ts` | New — export barrel |
| `src/components/ConfirmImportDialog.tsx` | Migrated to `ConfirmDialog` |
| `src/components/DeleteWorkoutDialog.tsx` | Migrated to `ConfirmDialog` |
| `src/components/MigrationErrorDialog.tsx` | Migrated to `ConfirmDialog` |
| `src/components/exercises/ExerciseForm.tsx` | Migrated to `FormDialog` |
| `src/components/exercises/MuscleGroupForm.tsx` | Migrated to `FormDialog` |
| `src/components/routines/RoutineList.tsx` | Props removed; inline dialog → `ConfirmDialog`; navigation → `useNavigate()` |
| `src/components/routines/RoutineEditor.tsx` | Props removed; `routineId` → `useParams()`; navigation → `useNavigate()` |
| `src/components/routines/RoutineWorkoutForm.tsx` | Props removed; `routineId` → `useParams()`; navigation → `useNavigate()` |

## Gotchas

- **`basename` must match Vite `base`**: The router is created with `basename: '/workout-tracker'`. If `vite.config.ts` `base` ever changes, update the router basename to match — otherwise all route matching silently breaks.
- **No `<BrowserRouter>` wrapper needed**: `RouterProvider` replaces the need for any `<BrowserRouter>` in `main.tsx` or `App.tsx`.
- **`useNavigate` only works inside the router**: Any component using `useNavigate()` must be rendered inside `<RouterProvider>`. Components rendered outside (e.g., in a future test harness) must be wrapped with a `<MemoryRouter>`.
