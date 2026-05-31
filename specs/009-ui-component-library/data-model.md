# Data Model: Shared UI Component Library & URL Routing

## Database Changes

**None.** This feature is a pure UI and routing refactor. No Drizzle schema files, no migrations, no DB helper functions are added, removed, or modified.

---

## UI Component Interfaces

These are the prop contracts for the three new shared components. They define what data each component needs and what events it emits — no implementation details.

### `ConfirmDialog`

A controlled dialog for destructive or confirmatory prompts.

| Prop | Type | Required | Description |
|---|---|---|---|
| `open` | `boolean` | Yes | Whether the dialog is visible |
| `title` | `string` | Yes | Dialog title text |
| `children` | `React.ReactNode` | Yes | Body content (text or elements) |
| `confirmLabel` | `string` | Yes | Primary action button label |
| `cancelLabel` | `string` | No | Cancel button label (default: `"Cancel"`) |
| `confirmColor` | `"error" \| "warning" \| "primary"` | No | Primary button color (default: `"primary"`) |
| `onConfirm` | `() => void` | Yes | Called when primary action is clicked |
| `onCancel` | `() => void` | No | Called when cancel is clicked or backdrop clicked. When `undefined`, the dialog is non-dismissible (for migration error). |

**Validation rules**:
- `title` must be a non-empty string
- When `onCancel` is `undefined`, the cancel button is not rendered and backdrop clicks are no-ops

---

### `FormDialog`

A controlled dialog shell for form content. Manages layout only — no form state.

| Prop | Type | Required | Description |
|---|---|---|---|
| `open` | `boolean` | Yes | Whether the dialog is visible |
| `title` | `string` | Yes | Dialog title text |
| `onClose` | `() => void` | Yes | Called when the dialog is dismissed (cancel / backdrop) |
| `children` | `React.ReactNode` | Yes | Form field content rendered in the scrollable body area |
| `actions` | `React.ReactNode` | Yes | Action buttons rendered in the footer row |
| `maxWidth` | `"xs" \| "sm" \| "md"` | No | MUI dialog max width (default: `"xs"`) |
| `fullWidth` | `boolean` | No | Whether dialog stretches to `maxWidth` (default: `true`) |

---

### `DialogActionButtons`

A standardised cancel + primary action button pair. Enforces 44×44px touch targets. Typically used inside `FormDialog`'s `actions` prop, or assembled directly inside `ConfirmDialog`.

| Prop | Type | Required | Description |
|---|---|---|---|
| `cancelLabel` | `string` | No | Cancel button label (default: `"Cancel"`) |
| `confirmLabel` | `string` | Yes | Primary action button label |
| `confirmColor` | `"error" \| "warning" \| "primary"` | No | Primary button color (default: `"primary"`) |
| `onCancel` | `() => void` | Yes | Cancel callback |
| `onConfirm` | `() => void` | Yes | Primary action callback |
| `confirmDisabled` | `boolean` | No | Disables the primary button (e.g., while saving) |

---

## Route Definitions

The URL scheme introduced by this feature. All paths are relative to the app `basename` (`/workout-tracker`).

| Path | View Component | Tab Bar Visible | Notes |
|---|---|---|---|
| `/log` | `WorkoutTable` | Yes | Default landing route |
| `/routines` | `RoutineList` | Yes | |
| `/routines/new` | `RoutineEditor` | No | `routineId` derived from params = undefined → create mode |
| `/routines/:id/edit` | `RoutineEditor` | No | `routineId` derived from `:id` param; redirect to `/routines` if not found |
| `/routines/:id/start` | `RoutineWorkoutForm` | No | `routineId` from `:id`; redirect to `/routines` if not found |
| `/exercises` | `ExerciseLibrary` | Yes | |
| `/settings` | `SettingsPage` | Yes | |
| `*` (catch-all) | — | — | Redirects to `/log` |

### Route Parameter Constraints

- `:id` MUST be a positive integer string. Components parse it with `Number.parseInt(id, 10)` and treat `NaN` as "not found" (redirect to `/routines`).

### Navigation State Transitions

```
/log ←→ /routines
  └─ /routines/new          (back → /routines)
  └─ /routines/:id/edit     (back → /routines)
  └─ /routines/:id/start    (on save → /log, on back → /routines)
/exercises (independent)
/settings  (independent)
```

---

## Removed State

The following App.tsx state is deleted by this feature:

| Removed | Replaced by |
|---|---|
| `type ActiveView = ...` (discriminated union) | URL path |
| `const [activeView, setActiveView] = useState<ActiveView>(...)` | `useLocation()` |
| `setActiveView({ type: 'edit-routine', routineId })` call sites | `navigate('/routines/:id/edit')` |
| `onBack`, `onAdd`, `onEdit`, `onStart` props on routine components | `useNavigate()` inside the component |
