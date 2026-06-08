# Quickstart: Routine Draft Persistence

## Overview

This feature adds a SQLite-backed draft that auto-saves the routine workout form as the user types, survives page reloads, and provides a visual badge to signal the in-progress session.

## Key files

| File | Role |
|------|------|
| `src/db/entities/routine-workout-draft/schema.ts` | New Drizzle table definition |
| `src/db/entities/routine-workout-draft/types.ts` | TypeScript types for draft data |
| `src/db/entities/routine-workout-draft/repository.ts` | `save`, `get`, `clear` DB operations |
| `src/db/schema.ts` | Re-export the new schema (add one line) |
| `src/database.ts` | Expose `saveDraft`, `getDraft`, `clearDraft` |
| `drizzle/<timestamp>_routine-workout-draft.sql` | Generated migration (run drizzle-kit generate) |
| `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts` | Auto-save on watch, restore on load, clear on submit |
| `src/routes/routines/RoutineList/hooks/useRoutines.ts` | Load `draftRoutineId` on mount |
| `src/routes/routines/RoutineCard.tsx` | "In Progress" badge when `isInProgress` |
| `src/routes/routines/RoutineList/views/RoutineListView.tsx` | Pass `draftRoutineId` to cards |
| `src/AppLayout.tsx` | Routines tab badge via `useDraftBadge` |
| `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx` | "Discard" button + confirm dialog |

## Step-by-step implementation order

1. **Schema** — create `src/db/entities/routine-workout-draft/schema.ts`, `types.ts`, then add the export to `src/db/schema.ts`.
2. **Migration** — run `npx drizzle-kit generate`; verify the generated `.sql` in `drizzle/` contains the `CREATE TABLE` and the `ON DELETE CASCADE` FK.
3. **Repository** — implement `RoutineWorkoutDraftRepository` with `save`, `get`, `clear` in `repository.ts`.
4. **Database facade** — add `saveDraft`, `getDraft`, `clearDraft` to `src/database.ts`.
5. **Draft restore** — extend `useRoutineWorkout.load()` to call `getDraft()` and merge saved values into form defaultValues.
6. **Auto-save** — add `watch` + debounced `useEffect` in `useRoutineWorkout` that calls `saveDraft` on every change.
7. **Clear on submit** — add `clearDraft()` call inside `useRoutineWorkout.submit()` after all workouts are created.
8. **Discard** — add `discardDraft` to `useRoutineWorkout`; add "Discard" button + `ConfirmDialog` to `RoutineWorkoutView`.
9. **Badge — list** — extend `useRoutines` to load `draftRoutineId`; pass to `RoutineListView` → `RoutineCard`.
10. **Badge — tab** — add `useDraftBadge` logic in `AppLayout`; wrap `PlaylistPlayIcon` in MUI `Badge`.

## Running locally

```bash
npm run dev         # dev server (no service worker)
npm run lint        # must pass before commit
npm run typecheck   # must pass before commit
```

After schema changes:
```bash
npx drizzle-kit generate   # generates the migration SQL
```

The migration runs automatically on next app start.

## Verifying the feature

1. Open the app, go to Routines → tap "Start" on any routine.
2. Enter weight/reps for at least one set.
3. Switch to the Log tab — observe Routines tab shows a dot badge.
4. Switch back to Routines — observe the in-progress routine has a badge.
5. Hard-reload the page — observe the badge is still present.
6. Tap the routine — observe the form re-opens with previously entered values.
7. Submit the form — observe the badge disappears.
8. Repeat steps 1–3, then use the "Discard" button inside the form — confirm the badge disappears.
9. Delete a routine that has an in-progress draft — confirm the badge disappears immediately.

## NaN ↔ null conversion

React Hook Form uses `NaN` for empty numeric fields (via `valueAsNumber`). SQLite JSON does not support `NaN`. The hook layer handles conversion:

- **Saving**: `Number.isNaN(v) ? null : v`
- **Restoring**: `v === null ? NaN : v`

This conversion must happen in `useRoutineWorkout`, not in the repository.

## Singleton upsert pattern

```typescript
await database
  .insert(routineWorkoutDraft)
  .values({ draftData: json, id: 1, routineId })
  .onConflictDoUpdate({
    set: { draftData: json, routineId, updatedAt: sql`CURRENT_TIMESTAMP` },
    target: routineWorkoutDraft.id,
  });
```
