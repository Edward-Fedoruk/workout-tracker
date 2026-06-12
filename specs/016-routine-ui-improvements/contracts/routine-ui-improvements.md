# UI Contracts: Routine UI Improvements

## RoutineCard (updated)

**File**: `src/routes/routines/RoutineCard.tsx`

```
Props (additions/changes):
  routine.exercises[].exerciseName  — already present, now rendered as chips
  onStart                           — already present, moved next to title
  onEdit / onDelete                 — REMOVED from card

Renders:
  - Routine name (h6 Typography, same as before)
  - Green "Start" Button next to the name (color="success" or sx green)
  - Disabled + tooltip when routine.exercises.length === 0
  - Exercise name chips below the title (one Chip per exercise, size="small", flexWrap)
  - NO Edit button
  - NO Delete button
```

---

## RoutineListView (updated)

**File**: `src/routes/routines/RoutineList/views/RoutineListView.tsx`

```
Props removed:
  onEdit    — no longer passed to RoutineCard
  onDelete  — no longer passed to RoutineCard (ConfirmDialog stays in RoutineEditor)

Layout changes:
  - Title Typography variant: h5 → h6
  - "Add Routine" Button removed
  - Fab (color="secondary", sx={{ bottom: 80, position: 'fixed', right: 24 }}) added
```

---

## RoutineEditorView (updated)

**File**: `src/routes/routines/RoutineEditor/views/RoutineEditorView.tsx`

```
New elements in header:
  - MoreVertIcon IconButton (top-right)
  - MUI Menu with two MenuItems:
      "Edit name"  → opens RoutineNameForm modal (existing)
      "Delete"     → opens ConfirmDialog (moved from RoutineListView)

New props required from hook:
  onEdit: () => void       — triggers name edit flow
  onDelete: () => void     — triggers delete confirm flow
  menuAnchor: HTMLElement | null
  setMenuAnchor: (el: HTMLElement | null) => void
```

---

## RoutineWorkoutExercise (updated)

**File**: `src/routes/routines/RoutineWorkout/views/RoutineWorkoutExercise.tsx`

```
New props:
  imageFilename?: string   — exercise image filename for Avatar

Per exercise header:
  - Avatar (56×56) to the left of exercise name
      src={imageFilename ? `${BASE_URL}exercises/${imageFilename}` : undefined}
      fallback: <FitnessCenterIcon />
  - Exercise name remains a ButtonBase when onNavigateToExercise is defined

Per set row:
  Before: <Typography sx={{ minWidth: 40 }}>Set {n}</Typography>
  After:  <LooksOneIcon /> / <LooksTwoIcon /> / <Looks3Icon /> ... (same color="secondary" as log table)

  Weight field:
    label: "Weight (kg)" → "kg"

  Checkbox (new, right side of row):
    <Checkbox
      checked={field.value}
      onChange={...}
      color="success"
      sx={{ p: 0.5 }}
    />

  Row background:
    sx={{ bgcolor: completed ? 'success.light' : 'transparent', borderRadius: 1 }}
    (applied to the outer Box of each set row)
```

---

## RoutineWorkoutView (updated)

**File**: `src/routes/routines/RoutineWorkout/views/RoutineWorkoutView.tsx`

```
Log Workout button:
  disabled={isSubmitting || !allSetsCompleted}

allSetsCompleted computed as:
  watch('exercises').every(ex => ex.sets.every(s => s.completed === true))
```

---

## RoutineWorkoutForm schema (updated)

**File**: `src/routes/routines/RoutineWorkout/RoutineWorkoutForm.schema.ts`

```
SetValues shape gains:
  completed: z.boolean().default(false)

defaultValues for each set:
  completed: savedSet?.completed ?? false
```

---

## useRoutineWorkout hook (updated)

**File**: `src/routes/routines/RoutineWorkout/hooks/useRoutineWorkout.ts`

```
autoSave serialises completed field alongside weight/reps:
  data[key][setIndex] = {
    completed: set.completed ?? false,
    reps: ...,
    weight: ...,
  }

load() restores completed from draft:
  completed: savedSet?.completed ?? false

Prefill (weight/reps) from getLastSets:
  Injected as defaultValues, not placeholder.
  Fallback: for each set position where weight and reps are null in most recent workout,
  call getLastSetsWithFallback which walks backwards to find a non-null value.
```

---

## getLastSets / getLastSetsWithFallback (updated)

**File**: `src/db/entities/routine-exercise/repository.ts`

```
Existing getLastSets:
  Returns sets from the single most recent workout (null if no prior workout).

New behaviour (rename to getLastSetsWithFallback or extend in place):
  For each position 1..setCount:
    1. Use value from most recent workout if non-null.
    2. If null: run a second query:
         SELECT s.weight, s.reps
         FROM workout_log w JOIN workout_set s ON s.workout_id = w.id
         WHERE LOWER(w.exercise_name) = LOWER(?)
           AND s.set_number = ?
           AND (s.weight IS NOT NULL OR s.reps IS NOT NULL)
         ORDER BY w.workout_date DESC, w.id DESC
         LIMIT 1
    3. Use that value or leave as null if no history exists.

Exposed via database.ts as getLastExerciseSets (existing export name, updated internally).
```
