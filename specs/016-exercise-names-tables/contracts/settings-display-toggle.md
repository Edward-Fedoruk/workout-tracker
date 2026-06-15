# UI Contract: Display Settings Toggle

**Component**: `src/routes/settings/views/SettingsView.tsx` (updated)  
**Hook**: `src/routes/settings/hooks/useDisplaySettings.ts` (new)  
**Container**: `src/routes/settings/index.tsx` (updated)

## Hook: `useDisplaySettings`

```ts
export type UseDisplaySettingsReturn = ReturnType<typeof useDisplaySettings>;

// Returns:
{
  exerciseNamesInTables: boolean;   // current persisted value
  isLoading: boolean;               // true while initial DB read is in flight
  toggle: () => Promise<void>;      // flips and persists the value
}
```

- Loads once on mount via `getExerciseNamesInTables()`.
- `toggle()` calls `setExerciseNamesInTables(!current)` then updates local state.
- `isLoading` prevents the toggle rendering in indeterminate state on first paint.

## SettingsView addition

A new "Display" section inserted **above** the existing "Data" section:

```
<Typography variant="subtitle1">Display</Typography>
<FormControlLabel
  control={
    <Switch
      checked={displaySettings.exerciseNamesInTables}
      disabled={displaySettings.isLoading}
      onChange={() => { displaySettings.toggle().catch(() => undefined); }}
    />
  }
  label="Exercise Names in Tables"
/>
<Divider />
```

## Behaviour

- Toggle is persisted to the DB immediately on change; the Workout Log reflects the new preference when the user navigates back to it (no page reload needed — the Workout Log reads fresh on mount).
- Live rerender while the user is still on the Settings screen is not required (the Workout Log is unmounted during Settings navigation).
- While `isLoading` is true the switch is disabled (prevents race on first paint).
- No error state exposed to the user — failures are silent (same pattern as body weight).
