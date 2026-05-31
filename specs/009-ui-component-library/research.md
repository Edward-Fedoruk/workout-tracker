# Research: Shared UI Component Library & URL Routing

## React Router v6 Integration Pattern

**Decision**: Use `react-router-dom` v6 with `createBrowserRouter` + `RouterProvider`.

**Rationale**: `createBrowserRouter` is the recommended v6 API. It supports data loaders (optional), deferred rendering, and proper TypeScript generics. The legacy `<BrowserRouter>` wrapper works but is not the preferred v6 pattern per the React Router docs.

**Base path**: `vite.config.ts` sets `base: '/workout-tracker/'`. The router must be created with `createBrowserRouter([...], { basename: '/workout-tracker' })` to ensure all route matching and `<Link>` generation is relative to that prefix. Without this, all routes will fail in production (the deployed path would be `/workout-tracker/log` but the router would try to match `/log`).

**Alternatives considered**: hash-based routing (`createHashRouter`) avoids server configuration entirely. Rejected because the app is deployed as a static SPA (Vite already configures the catch-all), and hash URLs are less canonical. The existing vite.config.ts SPA fallback already handles serving `index.html` for all paths.

---

## DB-Ready Gate with React Router

**Decision**: Root layout component (`AppLayout`) holds the `initDatabase()` state and renders a full-page loading indicator until the DB is ready, then renders `<Outlet />` (the matched child route).

**Rationale**: The current `App.tsx` already uses a single `isDatabaseReady` gate. Preserving this as a layout-level concern keeps the gate centralised rather than duplicating it in every route component. Every route, including deep links, will always see a ready DB before it renders.

**Alternatives considered**:
- Per-route loaders: would require each route component to handle its own DB-ready logic — more code, more places to miss the gate.
- Redirect to `/log` on deep link when DB not ready: discards the user's intended destination. The spec explicitly requires preserving the target route.

**Migration error path**: `MigrationErrorDialog` is always-open and non-dismissible. This lives at the `AppLayout` level, rendered before the `<Outlet />`. If a `MigrationError` is caught during init, the layout renders only the dialog (no outlet, no tab bar). This is identical to the current behaviour.

---

## MUI Tabs ↔ React Router Sync

**Decision**: Tab bar reads its active state from `useLocation().pathname`; tab change calls `useNavigate()`.

**Rationale**: MUI `<Tabs value={...}>` requires an explicit controlled value. Deriving it from the current pathname makes the Tabs a pure function of the URL — no additional state needed. Tab onChange fires `navigate('/log')` etc.

**Tab visibility**: The tab bar is shown only when the pathname matches one of the four top-level tab routes (`/log`, `/routines`, `/exercises`, `/settings`). Sub-routes (`/routines/new`, `/routines/:id/edit`, `/routines/:id/start`) hide the tab bar, matching current behaviour where `showTabBar` was false for `edit-routine` and `start-routine` views.

**Implementation**: A helper `pathnameToTabValue(pathname: string): string | false` returns the active tab value or `false` (no tab selected / hide bar).

---

## Removing Callback Props from Navigation-Owning Components

**Decision**: Remove `onBack`, `onAdd`, `onEdit`, `onStart` props from `RoutineList`, `RoutineEditor`, and `RoutineWorkoutForm`. Replace with `useNavigate()` and `useParams()`.

**Rationale**: These props were the workaround for state-based routing — components called `setActiveView(...)` indirectly. With URL routing the components own their navigation directly. Keeping the props would require `App.tsx` to still orchestrate navigation, defeating the purpose of the refactor.

**`RoutineEditor`**: `routineId` prop replaced by `useParams<{ id: string }>()`. When `id` is `undefined` (the `/routines/new` route), the component creates a new routine. `onBack` replaced by `navigate('/routines')`.

**`RoutineWorkoutForm`**: `routineId` and `onBack` similarly replaced. After saving the workout, navigate to `/log`.

**`RoutineList`**: `onAdd`, `onEdit`, `onStart` replaced by `navigate()` calls.

---

## Non-existent Routine ID Redirect

**Decision**: After DB load, if `getRoutineById(id)` returns `null`, call `navigate('/routines', { replace: true })`.

**Rationale**: Preventing broken UI for stale bookmarks. `replace: true` avoids adding the broken URL to browser history (the user can still press back and return to a valid page).

---

## Shared UI Component Structure

**Decision**: Three components in `src/components/ui/`:

| Component | Replaces |
|---|---|
| `ConfirmDialog` | Inline `Dialog`+`DialogTitle`+`DialogContent`+`DialogActions` in `DeleteWorkoutDialog`, `ConfirmImportDialog`, `MigrationErrorDialog`, and `RoutineList`'s inline delete dialog |
| `FormDialog` | Dialog shell in `ExerciseForm` and `MuscleGroupForm` |
| `DialogActionButtons` | Cancel + primary `Button` pairs with enforced 44px touch targets and `sx={{ minHeight: 44 }}` baked in |

**Rationale**: Grouping by dialog role (confirm vs. form) captures the natural pattern already present. Both share a title + content area + action row, but `ConfirmDialog` manages its own action buttons (cancel/confirm) while `FormDialog` exposes an `actions` slot for custom button arrangements (e.g., the "Add" vs. "Save" label logic in `ExerciseForm`).

`DialogActionButtons` is an internal helper used by both — callers should not need to use it directly unless they are building something outside the two templates.

**MigrationErrorDialog special case**: The dialog is always open and has no dismiss path. `ConfirmDialog` receives an optional `onClose` prop; when `undefined`, the MUI Dialog's backdrop click is a no-op. `MigrationErrorDialog` passes `onClose={undefined}` and two action buttons (Retry, Reset Database) — these fit naturally into `ConfirmDialog`'s `actions` override slot.

---

## No Database Schema Changes

This feature is a pure UI + routing refactor. No Drizzle schema files, migrations, or DB helper functions change. Constitution Principles I–IV are untouched.
