# Quickstart: Rep Range for Routine Exercises

Implementation in 5 ordered steps. Run `npm run typecheck` after each step to verify no regressions before moving on.

---

## Step 1 — Update the Drizzle schema (`src/db/schema.ts`)

In the `routineExercise` table definition:

1. Remove the `suggestedReps` column and its check constraint.
2. Add `minReps` and `maxReps` columns with `notNull()`.
3. Add check constraints for both new columns.

```ts
// Remove:
suggestedReps: integer('suggested_reps').notNull(),
check('suggested_reps_check', sql`${table.suggestedReps} BETWEEN 1 AND 99`),

// Add:
minReps: integer('min_reps').notNull(),
maxReps: integer('max_reps').notNull(),
check('min_reps_check', sql`${table.minReps} BETWEEN 1 AND 99`),
check('max_reps_check', sql`${table.maxReps} BETWEEN 1 AND 99`),
```

Then generate the migration:

```bash
npx drizzle-kit generate
```

This produces a new file in `drizzle/` (e.g., `0004_reps_range.sql`).

---

## Step 2 — Augment the generated migration

Open the generated SQL file. The drizzle-kit output will include ADD COLUMN and DROP COLUMN statements. Edit it to insert a data migration step **between** the ADD COLUMN and DROP COLUMN blocks:

```sql
ALTER TABLE `routine_exercise` ADD `min_reps` integer NOT NULL DEFAULT 10;
--> statement-breakpoint
ALTER TABLE `routine_exercise` ADD `max_reps` integer NOT NULL DEFAULT 10;
--> statement-breakpoint
UPDATE `routine_exercise` SET `min_reps` = `suggested_reps`, `max_reps` = `suggested_reps`;
--> statement-breakpoint
ALTER TABLE `routine_exercise` DROP COLUMN `suggested_reps`;
```

The `DEFAULT 10` in the ADD COLUMN lines is a scaffold value that satisfies SQLite's NOT NULL requirement; the `UPDATE` immediately replaces it with the real value from `suggested_reps`. Every existing row will have `min_reps = max_reps = (old) suggested_reps` after the migration commits.

> Note: Check that drizzle-kit did not use a CREATE TABLE / recreate pattern for the DROP COLUMN. If it did, ensure the new table definition includes both new columns and excludes the old one, and that the INSERT ... SELECT populates `min_reps` and `max_reps` from `suggested_reps`.

---

## Step 3 — Update `routineHelpers.ts` and `routineUtilities.ts`

### `src/db/routineHelpers.ts`

Change `addRoutineExercise` and `updateRoutineExercise` to accept `minReps` and `maxReps` instead of `suggestedReps`. Update the Drizzle `.values()`/`.set()` calls accordingly.

### `src/components/routines/routineUtilities.ts`

1. Update `validateExercise` to accept `minReps` and `maxReps` instead of `reps`:
   - Validate each independently: whole numbers, 1–99.
   - Add cross-field check: if `minReps > maxReps`, set `maxReps` error to `"Max reps must be ≥ min reps"`.
   - Update return type's error keys from `reps` to `minReps`/`maxReps`.

2. Add `formatRepRange`:
   ```ts
   export const formatRepRange = (minReps: number, maxReps: number): string =>
     minReps === maxReps ? `${minReps} reps` : `${minReps}–${maxReps} reps`;
   ```

---

## Step 4 — Update `RoutineEditor.tsx`

The exercise dialog currently has one `reps` field. Replace it with two fields.

1. In `ExerciseFormState`: replace `reps: string` with `minReps: string` and `maxReps: string`.

2. Default values in `openAddExercise`: `{ name: '', minReps: '8', maxReps: '12', sets: '3' }` (or any sensible default range).

3. In `openEditExercise`: populate from `exercise.minReps` / `exercise.maxReps`.

4. In the dialog `<Box sx={{ display: 'flex', gap: 2 }}>` section: replace the single `TextField` for "Suggested reps" with two `TextField` components side-by-side:
   - "Min Reps" bound to `exerciseForm.minReps` / `exerciseErrors.minReps`
   - "Max Reps" bound to `exerciseForm.maxReps` / `exerciseErrors.maxReps`
   - Both `type="number"` with `slotProps={{ htmlInput: { min: 1, max: 99 } }}`

5. In `exerciseErrors` state type: replace `reps?: string` with `minReps?: string; maxReps?: string`.

6. In `handleExerciseSubmit`: parse both fields, pass to updated `validateExercise` and then to updated `addRoutineExercise`/`updateRoutineExercise`.

---

## Step 5 — Update display components

### `src/components/routines/ExerciseRow.tsx`

Replace:
```tsx
{exercise.suggestedSets} × {exercise.suggestedReps}
```
With:
```tsx
{exercise.suggestedSets} × {formatRepRange(exercise.minReps, exercise.maxReps)}
```
Import `formatRepRange` from `routineUtilities`.

### `src/components/routines/RoutineWorkoutExercise.tsx`

Replace the guidance line:
```tsx
Suggested: {exercise.suggestedSets} × {exercise.suggestedReps}
```
With:
```tsx
Target: {exercise.suggestedSets} × {formatRepRange(exercise.minReps, exercise.maxReps)}
```

The reps inputs remain empty (no pre-fill). No other changes needed in this component.

---

## Verification

After all steps:

```bash
npm run typecheck   # must pass — no suggestedReps references remain
npm run lint        # must pass
npm run build       # must pass
```

Manual smoke test:
1. `npm run dev` → create a new routine, add an exercise with min = 8, max = 12.
2. Verify "8–12 reps" appears in the exercise list.
3. Start a workout from that routine → verify "Target: 3 × 8–12 reps" label appears, reps input is empty.
4. Reload the page → verify the routine still shows the correct range (OPFS persisted).
5. Edit the exercise → verify the form pre-populates 8 and 12 in the two fields.

For migration of existing data: if you have existing routines from before this change, verify they still appear with the correct rep value shown as "X reps" (min = max).
