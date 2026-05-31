# Contract: src/utils/erm.ts changes

**Feature**: 008-bodyweight-erm-weight

## Changed: computeEffectiveWeight

```ts
// Before
computeEffectiveWeight(parameters: {
  bodyWeight: null | number;
  classification: ExerciseClassification;
  loggedWeight: number;             // was non-nullable
}): null | number

// After
computeEffectiveWeight(parameters: {
  bodyWeight: null | number;
  classification: ExerciseClassification;
  loggedWeight: null | number;      // null treated as 0
}): null | number
```

### Behavior

- `loggedWeight = null` → treated as `0` for all calculations (same as explicit `0`)
- `standard` + `null` weight → returns `null` (standard exercises should never produce null weight via validation, but this is the safe default)
- `bodyweight`/`assisted` + `null` loggedWeight → `bodyWeight + 0` if bodyWeight is set; `null` if bodyWeight is null
- Effective weight ≤ 0 → `null` (unchanged behavior)

## Unchanged

`computeERM(effectiveWeight: number, reps: number): number` — signature and implementation unchanged.

`ExerciseClassification` type — unchanged.
