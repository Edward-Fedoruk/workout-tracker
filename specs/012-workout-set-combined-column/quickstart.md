# Quickstart: Combined Workout Set Column

## What changes

One file: `src/routes/workouts/WorkoutSetRow.tsx`. `WorkoutsView.tsx` and all DB code stay as-is.

## Steps

1. **Add a pure formatter** in `WorkoutSetRow.tsx`:

   ```ts
   export const formatSetCell = (
     weight: null | number,
     reps: null | number,
   ): string => {
     if (weight !== null && reps !== null) return `${weight}kg × ${reps}`;
     if (weight !== null) return `${weight}kg`;
     if (reps !== null) return `${reps}`;
     return '—';
   };
   ```

2. **Replace the two columns (weight, reps) with one combined column** in `buildSetColumns`,
   keeping the eRM column. The combined column derives its value from both fields:

   ```ts
   {
     accessorFn: (row) =>
       formatSetCell(
         row[`Set${setNumber}_weight`] as null | number,
         row[`Set${setNumber}_reps`] as null | number,
       ),
     header: `S${setNumber}`,
     id: `Set${setNumber}`,
     size: 110,
   },
   // ...existing eRM column unchanged...
   ```

   > Note: indexing `WorkoutTableRow` by a computed key needs a typed key (`as keyof
   > WorkoutTableRow`), consistent with the existing `weightKey`/`repsKey` pattern — keep the
   > typed-key approach rather than a loose cast, per Constitution IX.

3. **Update `HIDDEN_SET_COLUMNS`** so Sets 2–5 hide via the new ids:

   ```ts
   export const HIDDEN_SET_COLUMNS: Record<string, boolean> = {
     Set2: false, Set2_erm: false,
     Set3: false, Set3_erm: false,
     Set4: false, Set4_erm: false,
     Set5: false, Set5_erm: false,
   };
   ```

## Verify

- `npm run dev`, open the workouts route.
- Set 1 shows `S1` as e.g. `25kg × 10` and `S1 eRM` as before; no standalone `S1 kg` / `S1 reps`.
- Sets 2–5 remain hidden by default; toggling them on shows their combined `S{n}` column.
- A set with only reps shows `10`; only weight shows `25kg`; empty shows `—`.
- `npm run lint` and `npm run typecheck` pass.
