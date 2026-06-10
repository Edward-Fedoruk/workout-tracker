# Phase 1 Data Model: Combined Workout Set Column

## Stored data: NO CHANGE

This feature is presentation-only (spec FR-004). No tables, columns, types, or queries change.
The existing `WorkoutTableRow` type already exposes everything needed:

```ts
// src/db/entities/workout-log/types.ts (existing — unchanged)
export type WorkoutTableRow = {
  // ...id, workout_date, exercise_name...
  Set1_weight: null | number;
  Set1_reps:   null | number;
  Set1_erm:    null | number;
  // ...Set2..Set5 likewise
};
```

## Display projection (new, in-memory only)

The combined column is a pure derivation over two existing fields. No new persisted entity.

| Display field | Source fields | Rule |
|---------------|---------------|------|
| `Set{n}` (combined cell) | `Set{n}_weight`, `Set{n}_reps` | `formatSetCell(weight, reps)` |
| `Set{n}_erm` | `Set{n}_erm` | Unchanged (`formatERM`) |

### `formatSetCell(weight, reps)` truth table

| weight | reps | Output |
|--------|------|--------|
| `25` | `10` | `25kg × 10` |
| `0`  | `8`  | `0kg × 8` |
| `22.5` | `10` | `22.5kg × 10` |
| `25` | `null` | `25kg` |
| `null` | `10` | `10` |
| `null` | `null` | `—` |

Signature: `(weight: null | number, reps: null | number) => string` — pure, no side effects.
