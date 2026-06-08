# Contract: Component API — Routine Draft Persistence

Changes to existing component prop interfaces and new hook return shapes.

---

## `useRoutines` hook — extended return

File: `src/routes/routines/RoutineList/hooks/useRoutines.ts`

**Added field**:
```typescript
draftRoutineId: null | number   // routineId of the active draft, null if none
```

`draftRoutineId` is loaded once on mount alongside `refresh()`. It is set to `null` immediately after the draft is cleared (discard or submit), causing the badge to disappear without a page reload.

---

## `RoutineListView` props — extended

File: `src/routes/routines/RoutineList/views/RoutineListView.tsx`

**Added prop**:
```typescript
draftRoutineId: null | number
```

Passed through to each `RoutineCard` as `isInProgress={routine.id === draftRoutineId}`.

---

## `RoutineCard` props — extended

File: `src/routes/routines/RoutineCard.tsx`

**Added prop**:
```typescript
isInProgress?: boolean   // default false
```

When `true`, renders a visual indicator (e.g., MUI `Chip` with label "In Progress") on the card.

---

## `useRoutineWorkout` hook — extended return

File: `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`

**Modified behaviour of `load(routineId)`**:
- After loading the routine and prefills, also calls `getDraft()`.
- If `draft.routineId === routineId`, merges saved set values into the form default values before returning.
- If no matching draft, behaviour is unchanged (prefills from last workout log as before).

**Added field**:
```typescript
discardDraft: () => Promise<void>
```
Clears the draft from the DB (calls `clearDraft()`). Used by the discard confirmation flow.

**Modified behaviour of `submit(values)`**:
- After all `createWorkout` calls succeed, calls `clearDraft()` before returning `true`.

---

## `RoutineWorkoutView` props — extended

File: `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx`

**Added props**:
```typescript
onDiscard: () => void      // opens the discard confirmation dialog
isDiscarding?: boolean     // disables buttons while discard is in flight (optional)
```

The view renders a "Discard" button (secondary/outlined style, danger colour). Clicking it calls `onDiscard`. A `ConfirmDialog` is owned by the view (or by the container — see quickstart).

---

## `AppLayout` — badge integration

File: `src/AppLayout.tsx`

**Pattern**: A `useDraftBadge` hook (inline in `AppLayout` or extracted to `src/hooks/useDraftBadge.ts`) returns `hasDraft: boolean`. The `PlaylistPlayIcon` used in `BottomNavigationAction` for the Routines tab is wrapped in a MUI `Badge` component:

```tsx
<BottomNavigationAction
  icon={
    <Badge color="error" variant="dot" invisible={!hasDraft}>
      <PlaylistPlayIcon />
    </Badge>
  }
  label="Routines"
  value="routines"
/>
```

`hasDraft` is re-queried whenever the route changes (via `useEffect` on `location.pathname`) so the badge reflects the latest draft state without a full reload.
