# Quickstart: Persisted eRM & Optional Weight Entry

**Feature**: 008-bodyweight-erm-weight  
**Date**: 2026-05-31  
**Prerequisites**: Feature 007 (eRM & Body Weight Settings) is fully deployed on `main`.

Execute steps in order. Each step is independently buildable and testable.

---

## Step 1 — Migration & Schema

**Files**: `src/db/schema.ts`, `drizzle/0006_persisted_erm.sql`

1. Edit `src/db/schema.ts` — update `workoutSet`:
   - Remove `.notNull()` from `weight`
   - Add `erm: real('erm')` (nullable, no `.notNull()`)

2. Run `npx drizzle-kit generate` to produce `drizzle/0006_*.sql`.

3. Review the generated SQL. It should:
   - Rebuild `workout_set` with nullable `weight` and new `erm` column
   - Preserve the unique index on `(workout_id, set_number)`
   - Copy existing rows (existing `weight` values preserved, `erm` defaults to `NULL`)

4. `npm run build && npm run typecheck` — should pass (no consumers changed yet).

**Verify**: Open the app via `npm run preview`. Existing workout data still loads. No migration error dialog.

---

## Step 2 — erm.ts: accept null loggedWeight

**File**: `src/utils/erm.ts`

Update `computeEffectiveWeight`:

```ts
export const computeEffectiveWeight = (parameters: {
  bodyWeight: null | number;
  classification: ExerciseClassification;
  loggedWeight: null | number;        // changed from number
}): null | number => {
  const { bodyWeight, classification, loggedWeight } = parameters;
  const weight = loggedWeight ?? 0;

  if (classification === 'standard') {
    return weight <= 0 ? null : weight;
  }

  if (bodyWeight === null) return null;

  const effective = bodyWeight + weight;
  return effective <= 0 ? null : effective;
};
```

Run `npm run typecheck` — will surface all call sites that pass `number` where `null | number` is now expected (there are none yet since the signature widened).

---

## Step 3 — database.ts: persist eRM, update types

**File**: `src/database.ts`

### 3a — WorkoutTableRow: add eRM fields

Add `Set1_erm` through `Set5_erm` (all `null | number`) to `WorkoutTableRow`.

### 3b — listWorkouts: add eRM to pivot query

In the `MAX(CASE ...)` block, add one `erm` column per set number:

```sql
MAX(CASE WHEN s.set_number = 1 THEN s.erm END) AS Set1_erm,
```

(Repeat for set numbers 2–5.)

### 3c — createWorkout: accept null weight and erm

Update the `sets` parameter type:

```ts
sets: Array<{ reps: number; weight: null | number; erm: null | number }>
```

In the Drizzle insert, pass `weight: set.weight` and `erm: set.erm` (Drizzle accepts `null` for nullable columns).

### 3d — updateWorkout: same change

Same type update as `createWorkout`. The delete-and-reinsert pattern means erm is written fresh on every edit.

Run `npm run typecheck` — callers of `createWorkout`/`updateWorkout` will now fail to compile (they don't pass `erm` yet). That's expected; fix in Step 5.

---

## Step 4 — workoutFormUtilities.ts: body weight validation

**File**: `src/components/workoutFormUtilities.ts`

### 4a — Add bodyWeight to validateWorkoutForm params

```ts
export const validateWorkoutForm = (parameters: {
  bodyWeight: null | number;       // new
  classification: ExerciseClassification;
  exerciseName: string;
  sets: SetInput[];
  workoutDate: string;
}): FormErrors => { ... }
```

Pass `bodyWeight` down to `validateWeight`.

### 4b — Update validateWeight

```ts
const validateWeight = (
  rawWeight: string,
  classification: ExerciseClassification,
  bodyWeight: null | number,
): string | undefined => {
  const parsed = Number.parseFloat(rawWeight);
  const isEmpty = rawWeight.trim() === '';

  if (classification === 'standard') {
    if (isEmpty || !Number.isFinite(parsed) || parsed <= 0) {
      return 'Weight must be greater than 0';
    }
    return undefined;
  }

  if (classification === 'bodyweight') {
    if (!isEmpty && Number.isFinite(parsed) && parsed < 0) {
      return 'Weight must be 0 or greater';
    }
    if ((isEmpty || parsed === 0) && bodyWeight === null) {
      return 'Body weight not set — add it in Settings to log this exercise';
    }
    return undefined;
  }

  // assisted
  if (isEmpty && bodyWeight === null) {
    return 'Body weight not set — add it in Settings to log this exercise';
  }
  if (!isEmpty && !Number.isFinite(parsed)) {
    return 'Weight must be a number';
  }
  return undefined;
};
```

Run `npm run typecheck` — `WorkoutForm.tsx` call to `validateWorkoutForm` now fails (missing `bodyWeight`). Fix in Step 5.

---

## Step 5 — WorkoutForm.tsx: load body weight, compute & persist eRM

**File**: `src/components/WorkoutForm.tsx`

### 5a — Load body weight on mount

```ts
const [bodyWeight, setBodyWeight] = useState<null | number>(null);

useEffect(() => {
  const load = async () => {
    setBodyWeight(await getBodyWeight());
  };
  load().catch(() => undefined);
}, []);
```

Import `getBodyWeight` from `'../database'`.

### 5b — Pass bodyWeight to validateWorkoutForm

In the `validate` callback:

```ts
const newErrors = validateWorkoutForm({
  bodyWeight,
  classification,
  exerciseName,
  sets,
  workoutDate,
});
```

Add `bodyWeight` to the `useCallback` dependency array.

### 5c — Compute eRM per set before saving

Helper (can live at the top of WorkoutForm.tsx or in workoutFormUtilities.ts):

```ts
const computeSetERM = (
  rawWeight: string,
  reps: number,
  classification: ExerciseClassification,
  bodyWeight: null | number,
): null | number => {
  const loggedWeight = rawWeight.trim() === '' ? null : Number.parseFloat(rawWeight);
  const effective = computeEffectiveWeight({ bodyWeight, classification, loggedWeight });
  if (effective === null) return null;
  return computeERM(effective, reps);
};
```

In `handleSave`, build `parsedSets` with erm:

```ts
const parsedSets = sets.map((setInput) => {
  const reps = Number.parseInt(setInput.reps, 10);
  const weight = setInput.weight.trim() === '' ? null : Number.parseFloat(setInput.weight);
  const erm = computeSetERM(setInput.weight, reps, classification, bodyWeight);
  return { erm, reps, weight };
});
```

### 5d — WorkoutSetInputRow: allow empty weight for BW/assisted

`WorkoutSetInputRow` takes `weightInputProps` from `getWeightInputMin`. No change needed — the `min` attribute only guides the native number input picker, not validation. Empty fields are already possible with `type="number"`.

Verify `npm run typecheck` and `npm run lint` both pass.

---

## Step 6 — WorkoutSetRow.tsx: read stored eRM

**File**: `src/components/WorkoutSetRow.tsx`

### 6a — Drop computeSetERM and its dependencies

Remove `computeSetERM`, `SetColumnsOptions`, and the import of `computeEffectiveWeight`/`computeERM`.

### 6b — Update buildSetColumns to read stored eRM

```ts
const buildSetColumns = (
  setNumber: number,
): Array<MRT_ColumnDef<WorkoutTableRow>> => {
  const weightKey = `Set${setNumber}_weight` as keyof WorkoutTableRow;
  const repsKey   = `Set${setNumber}_reps`   as keyof WorkoutTableRow;
  const ermKey    = `Set${setNumber}_erm`    as keyof WorkoutTableRow;
  return [
    {
      accessorKey: weightKey,
      Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
      header: `S${setNumber} kg`,
      size: 80,
    },
    {
      accessorKey: repsKey,
      Cell: ({ cell }) => renderNullable(cell.getValue<null | number>()),
      header: `S${setNumber} reps`,
      size: 80,
    },
    {
      accessorKey: ermKey,
      Cell: ({ cell }) => formatERM(cell.getValue<null | number>()),
      header: `S${setNumber} eRM`,
      id: `Set${setNumber}_erm`,
      size: 90,
    },
  ];
};
```

### 6c — Update useSetColumns

Remove `SetColumnsOptions` parameter (no longer needed):

```ts
export const useSetColumns = (): Array<MRT_ColumnDef<WorkoutTableRow>> =>
  useMemo(() => [1, 2, 3, 4, 5].flatMap((n) => buildSetColumns(n)), []);
```

### 6d — Update WorkoutTable.tsx call site

Remove the `bodyWeight` and `classificationByName` props passed to `useSetColumns` (no longer accepted). Remove the body weight fetch and exercise list fetch from WorkoutTable if they were only used for eRM display — check if they're used elsewhere first.

Add `Set2_erm` through `Set5_erm` to `HIDDEN_SET_COLUMNS`.

---

## Step 7 — RoutineWorkoutForm.tsx: fix filter, compute eRM

**File**: `src/components/routines/RoutineWorkoutForm.tsx`

### 7a — Load exercises (for classification) and body weight

```ts
const [exercises, setExercises] = useState<Exercise[]>([]);
const [bodyWeight, setBodyWeight] = useState<null | number>(null);

useEffect(() => {
  const init = async () => {
    const [data, bw, exList] = await Promise.all([
      getRoutineById(routineId),
      getBodyWeight(),
      listExercises(),
    ]);
    // ... existing routine setup ...
    setBodyWeight(bw);
    setExercises(exList);
  };
  // ...
}, [routineId]);
```

### 7b — Fix handleSubmit filter

Replace the current two-step filter:

```ts
// Remove: .filter((setEntry) => setEntry.weight !== '' && setEntry.reps !== '')
// Remove: .filter((setEntry) => setEntry.weight > 0 && setEntry.reps > 0)

const classification =
  exercises.find((ex) => ex.name === exercise.exerciseName)?.classification ?? 'standard';

const filledSets = sets
  .filter((setEntry) => setEntry.reps !== '' && Number(setEntry.reps) > 0)
  .filter((setEntry) => {
    if (classification === 'standard') {
      return setEntry.weight !== '' && Number(setEntry.weight) > 0;
    }
    // bodyweight/assisted: allow empty or 0 weight if body weight is set
    if (setEntry.weight === '' || Number(setEntry.weight) === 0) {
      return bodyWeight !== null;
    }
    return true;
  })
  .map((setEntry) => {
    const weight = setEntry.weight.trim() === '' ? null : Number(setEntry.weight);
    const reps = Number(setEntry.reps);
    const effective = computeEffectiveWeight({ bodyWeight, classification, loggedWeight: weight });
    const erm = effective !== null ? computeERM(effective, reps) : null;
    return { erm, reps, weight };
  });
```

---

## Step 8 — routineHelpers.ts: handle nullable weight in getLastExerciseSets

**File**: `src/db/routineHelpers.ts`

`getLastExerciseSets` returns prefill weights for the routine workout form. With nullable weight, some sets may have `null` weight (unweighted BW sets). The prefill placeholder should show empty (not "null"):

```ts
export type LastExerciseSets = Array<{
  reps: number;
  setNumber: number;
  weight: null | number;          // was: number
}>;
```

In the query result mapping:
```ts
return (result.result.resultRows || []).map((row) => ({
  reps: row.reps,
  setNumber: row.set_number,
  weight: row.weight,             // null is now a valid value
}));
```

In `RoutineWorkoutExercise.tsx`, the placeholder for null weight should render as empty string:
```ts
placeholder={prefillEntry ? (prefillEntry.weight !== null ? String(prefillEntry.weight) : '') : ''}
```

---

## Verification Checklist

After all steps:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes  
- [ ] `npm run build` succeeds
- [ ] `npm run preview`: existing workout data loads without error
- [ ] Log a standard exercise with positive weight → eRM stored and displayed
- [ ] Log a body-weight exercise with empty weight (body weight set) → eRM uses body weight
- [ ] Log a body-weight exercise with empty weight (body weight NOT set) → error shown, set not saved
- [ ] Log an assisted exercise with negative weight → accepted, eRM computed
- [ ] Update body weight, revisit historical body-weight sets → stored eRM unchanged
- [ ] Edit a set (change reps) → eRM updates to reflect current body weight
- [ ] Log workout via routine with empty-weight BW exercise → set saves, eRM computed
- [ ] Pre-existing sets (migrated) show `—` for eRM, not a computed value
