# Contract: WorkoutBottomDrawer

**Component**: replaces the `FormDialog` usage in `WorkoutsView`  
**Implemented via**: MUI `SwipeableDrawer` anchored to `"bottom"` — no new component file; the `WorkoutsView` is updated in-place.

---

## Props (of the wrapping usage in WorkoutsView)

No new component is created. The existing `WorkoutForm` remains unchanged. The `FormDialog` import and usage in `WorkoutsView` is replaced with a `SwipeableDrawer`:

```tsx
<SwipeableDrawer
  anchor="bottom"
  disableSwipeToOpen
  onClose={handleCancelForm}
  onOpen={() => undefined}
  open={formDialog.isOpen}
  sx={{
    '& .MuiDrawer-paper': {
      borderRadius: '12px 12px 0 0',
      maxHeight: '90dvh',
      overflowY: 'auto',
    },
  }}
>
  {/* title bar + WorkoutForm */}
</SwipeableDrawer>
```

---

## Visual Structure

```
┌──────────────────────────────────────┐
│   ─────  (drag handle visual)        │
│  Add Workout              [×]        │  ← title + close button
├──────────────────────────────────────┤
│  [WorkoutForm contents]              │  ← scrollable area
│                                      │
│  (keyboard pushes form up,           │
│   content scrolls internally)        │
└──────────────────────────────────────┘
  ▲ slides up from bottom edge
```

---

## Height behaviour

| Condition | Result |
|-----------|--------|
| Form content shorter than 90dvh | Drawer sits at natural content height |
| Form content taller than 90dvh (e.g. keyboard open) | Drawer caps at 90dvh; content scrolls internally |

---

## Dismissal

| Trigger | Result |
|---------|--------|
| Swipe down on drawer | Closes without saving (calls `handleCancelForm`) |
| Tap backdrop | Closes without saving |
| Submit form successfully | Closes after save |
| Close (×) button inside drawer | Closes without saving |

---

## Constraints

| Constraint | Source | How satisfied |
|------------|--------|---------------|
| Bottom slide-up animation | FR-014 | `SwipeableDrawer anchor="bottom"` |
| Swipe-to-dismiss | FR-015 | `SwipeableDrawer` built-in |
| Max height 90% viewport | FR-016 (clarification C) | `maxHeight: '90dvh'` on paper |
| Internal scroll | FR-016 | `overflowY: 'auto'` on paper |
| No modal overlay | SC-005 | Dialog replaced; no centred overlay |
| Reuses existing WorkoutForm | Assumption | No changes to `WorkoutForm` internals |
