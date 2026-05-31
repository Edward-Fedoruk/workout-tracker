# Contract: database.ts changes

**Feature**: 008-bodyweight-erm-weight

## Changed exports

### createWorkout

```ts
// Before
createWorkout(
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ reps: number; weight: number }>,
): Promise<number>

// After
createWorkout(
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ reps: number; weight: null | number; erm: null | number }>,
): Promise<number>
```

The caller (WorkoutForm, RoutineWorkoutForm) computes `erm` before calling. DB helper stores it as-is.

### updateWorkout

```ts
// Before
updateWorkout(
  id: number,
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ reps: number; weight: number }>,
): Promise<void>

// After
updateWorkout(
  id: number,
  workoutDate: string,
  exerciseName: string,
  sets: Array<{ reps: number; weight: null | number; erm: null | number }>,
): Promise<void>
```

### listWorkouts

Returns `WorkoutTableRow` which now includes `Set1_erm` through `Set5_erm` (nullable number). The pivot query adds one `MAX(CASE ...)` column per set for `erm`.

### WorkoutTableRow

```ts
export type WorkoutTableRow = {
  exercise_name: string;
  id: number;
  Set1_erm:    null | number;
  Set1_reps:   null | number;
  Set1_weight: null | number;
  Set2_erm:    null | number;
  Set2_reps:   null | number;
  Set2_weight: null | number;
  Set3_erm:    null | number;
  Set3_reps:   null | number;
  Set3_weight: null | number;
  Set4_erm:    null | number;
  Set4_reps:   null | number;
  Set4_weight: null | number;
  Set5_erm:    null | number;
  Set5_reps:   null | number;
  Set5_weight: null | number;
  workout_date: string;
};
```

---

## Updated pivot query (listWorkouts)

```sql
SELECT
  w.id,
  w.workout_date,
  w.exercise_name,
  MAX(CASE WHEN s.set_number = 1 THEN s.weight END) AS Set1_weight,
  MAX(CASE WHEN s.set_number = 1 THEN s.reps   END) AS Set1_reps,
  MAX(CASE WHEN s.set_number = 1 THEN s.erm    END) AS Set1_erm,
  MAX(CASE WHEN s.set_number = 2 THEN s.weight END) AS Set2_weight,
  MAX(CASE WHEN s.set_number = 2 THEN s.reps   END) AS Set2_reps,
  MAX(CASE WHEN s.set_number = 2 THEN s.erm    END) AS Set2_erm,
  MAX(CASE WHEN s.set_number = 3 THEN s.weight END) AS Set3_weight,
  MAX(CASE WHEN s.set_number = 3 THEN s.reps   END) AS Set3_reps,
  MAX(CASE WHEN s.set_number = 3 THEN s.erm    END) AS Set3_erm,
  MAX(CASE WHEN s.set_number = 4 THEN s.weight END) AS Set4_weight,
  MAX(CASE WHEN s.set_number = 4 THEN s.reps   END) AS Set4_reps,
  MAX(CASE WHEN s.set_number = 4 THEN s.erm    END) AS Set4_erm,
  MAX(CASE WHEN s.set_number = 5 THEN s.weight END) AS Set5_weight,
  MAX(CASE WHEN s.set_number = 5 THEN s.reps   END) AS Set5_reps,
  MAX(CASE WHEN s.set_number = 5 THEN s.erm    END) AS Set5_erm
FROM workout_log w
LEFT JOIN workout_set s ON s.workout_id = w.id
GROUP BY w.id, w.workout_date, w.exercise_name
ORDER BY w.workout_date DESC, w.id DESC
```

---

## Unchanged exports

All other exports from `database.ts` are unchanged: `getWorkoutById`, `deleteWorkout`, `exportDatabaseBytes`, `replaceDatabaseAndReload`, `__devRollback`, and all re-exports from sub-helpers.
