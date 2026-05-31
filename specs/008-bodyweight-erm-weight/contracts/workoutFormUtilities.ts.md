# Contract: workoutFormUtilities.ts changes

**Feature**: 008-bodyweight-erm-weight

## Changed: validateWorkoutForm

```ts
// Before
validateWorkoutForm(parameters: {
  classification: ExerciseClassification;
  exerciseName: string;
  sets: SetInput[];
  workoutDate: string;
}): FormErrors

// After
validateWorkoutForm(parameters: {
  bodyWeight: null | number;          // new
  classification: ExerciseClassification;
  exerciseName: string;
  sets: SetInput[];
  workoutDate: string;
}): FormErrors
```

### Weight validation rules (per classification)

| Classification | Empty/null weight | 0 weight | Negative weight |
|----------------|-------------------|----------|-----------------|
| `standard`     | Error: "Weight must be greater than 0" | Error: "Weight must be greater than 0" | Error |
| `bodyweight`   | OK if bodyWeight set; Error if not | OK always | Error |
| `assisted`     | OK if bodyWeight set; Error if not | OK if bodyWeight set; Error if not | OK always |

**Error message when body weight is missing**:
`'Body weight not set — add it in Settings to log this exercise'`

This error appears as `SetErrors.weight` for the affected set (same field as weight validation errors).

### Changed: validateWeight signature (internal)

```ts
// Before (internal)
const validateWeight = (
  rawWeight: string,
  classification: ExerciseClassification,
): string | undefined

// After (internal)
const validateWeight = (
  rawWeight: string,
  classification: ExerciseClassification,
  bodyWeight: null | number,
): string | undefined
```

## Changed: SetInput

No type change. Empty string weight continues to represent "user left field blank". The validation layer interprets it by classification.

## Unchanged

`hasFormErrors`, `makeSetInput`, `getToday`, `getWeightInputMin`, `FormErrors`, `SetErrors` — all unchanged.
