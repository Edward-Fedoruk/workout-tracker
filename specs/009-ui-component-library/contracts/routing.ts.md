# Contract: Routing Structure

## Router Setup

```typescript
// src/router.tsx  (new file)

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ExerciseLibrary } from './components/exercises/ExerciseLibrary';
import { RoutineEditor } from './components/routines/RoutineEditor';
import { RoutineList } from './components/routines/RoutineList';
import { RoutineWorkoutForm } from './components/routines/RoutineWorkoutForm';
import { SettingsPage } from './components/settings/SettingsPage';
import { WorkoutTable } from './components/WorkoutTable';

export const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,   // DB gate + tab bar + MigrationErrorDialog
      children: [
        { path: '/log',                  element: <WorkoutTable /> },
        { path: '/routines',             element: <RoutineList /> },
        { path: '/routines/new',         element: <RoutineEditor /> },
        { path: '/routines/:id/edit',    element: <RoutineEditor /> },
        { path: '/routines/:id/start',   element: <RoutineWorkoutForm /> },
        { path: '/exercises',            element: <ExerciseLibrary /> },
        { path: '/settings',             element: <SettingsPage /> },
        { path: '/',    element: <Navigate replace to="/log" /> },
        { path: '*',    element: <Navigate replace to="/log" /> },
      ],
    },
  ],
  { basename: '/workout-tracker' },
);
```

---

## AppLayout Contract

```typescript
// src/AppLayout.tsx  (replaces App.tsx routing logic)

// AppLayout is a layout-route component (no props; uses <Outlet />)
// Responsibilities:
//   1. Calls initDatabase() once on mount
//   2. Shows full-page loading indicator while DB is not ready
//   3. If MigrationError caught, renders MigrationErrorDialog (no Outlet)
//   4. Once ready: renders tab bar (when on a tab route) + <Outlet />
//   5. Tab bar active value derived from useLocation().pathname

// Tab bar visibility: show when pathname is exactly one of:
//   /log | /routines | /exercises | /settings
// Hide for all other paths (sub-routes, catch-all).

type TabValue = 'exercises' | 'log' | 'routines' | 'settings';

function pathnameToTabValue(pathname: string): TabValue | false {
  const segments: Record<string, TabValue> = {
    '/exercises': 'exercises',
    '/log': 'log',
    '/routines': 'routines',
    '/settings': 'settings',
  };
  return segments[pathname] ?? false;
}
```

---

## Updated Component Navigation Contracts

### RoutineList (props removed)

```typescript
// Before:
type Props = {
  readonly onAdd: () => void;
  readonly onEdit: (routineId: number) => void;
  readonly onStart: (routineId: number) => void;
};

// After: no props
// Navigation handled internally via useNavigate():
//   onAdd    → navigate('/routines/new')
//   onEdit   → navigate(`/routines/${id}/edit`)
//   onStart  → navigate(`/routines/${id}/start`)
```

### RoutineEditor (props changed)

```typescript
// Before:
type Props = {
  readonly onBack: () => void;
  readonly routineId: null | number;
};

// After: no props
// routineId derived from: useParams<{ id: string }>().id
//   undefined id  → create mode (route: /routines/new)
//   numeric id    → edit mode   (route: /routines/:id/edit)
//   NaN or missing routine → navigate('/routines', { replace: true })
// onBack → navigate('/routines')
```

### RoutineWorkoutForm (props changed)

```typescript
// Before:
type Props = {
  readonly onBack: () => void;
  readonly routineId: number;
};

// After: no props
// routineId from useParams<{ id: string }>().id
// onBack     → navigate('/routines')
// After save → navigate('/log')
```
