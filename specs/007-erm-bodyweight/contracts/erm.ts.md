# Contract: `src/utils/erm.ts`

New file. Pure, synchronous utility functions for computing estimated 1-Rep Max. No DB access, no async, no React imports.

---

## Exports

### `ExerciseClassification`

```ts
export type ExerciseClassification = 'standard' | 'bodyweight' | 'assisted';
```

Re-exported here for consumers that only need the eRM utilities without importing from `exerciseHelpers.ts`. (The canonical definition lives in `exerciseHelpers.ts`; this may be a re-export or a shared import depending on implementation preference.)

---

### `computeEffectiveWeight(params): number | null`

Resolves the effective weight that enters the Epley formula.

```ts
export function computeEffectiveWeight(params: {
  bodyWeight: number | null;
  classification: ExerciseClassification;
  loggedWeight: number;
}): number | null
```

**Rules**:
- `standard`: returns `loggedWeight`.
- `bodyweight` or `assisted`:
  - If `bodyWeight` is `null` → returns `null` (body weight not set).
  - Otherwise returns `bodyWeight + loggedWeight`.
- If the result is `<= 0` → returns `null` (eRM undefined; caller shows placeholder).

---

### `computeERM(effectiveWeight: number, reps: number): number`

Applies the Epley formula. Caller is responsible for ensuring `effectiveWeight > 0` and `reps > 0`.

```ts
export function computeERM(effectiveWeight: number, reps: number): number
```

**Formula**: `effectiveWeight * (1 + reps / 30)`

**Rounding**: Returns the raw floating-point result; display rounding (e.g., 1 decimal place) is the caller's responsibility.

---

## Usage example

```ts
const effective = computeEffectiveWeight({
  bodyWeight: 75,
  classification: 'bodyweight',
  loggedWeight: 10,
});
// effective = 85

const erm = effective !== null ? computeERM(effective, 5) : null;
// erm ≈ 99.17
```
