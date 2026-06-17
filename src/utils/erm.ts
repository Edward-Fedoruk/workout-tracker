export type ExerciseClassification = 'bodyweight' | 'standard';

export const computeEffectiveWeight = (parameters: {
  bodyWeight: null | number;
  classification: ExerciseClassification;
  loggedWeight: null | number;
}): null | number => {
  const { bodyWeight, classification, loggedWeight } = parameters;
  const weight = loggedWeight ?? 0;

  if (classification === 'standard') {
    return weight <= 0 ? null : weight;
  }

  if (bodyWeight === null) {
    return null;
  }

  const effective = bodyWeight + weight;
  return effective <= 0 ? null : effective;
};

export const computeERM = (effectiveWeight: number, reps: number): number => {
  return effectiveWeight * (1 + reps / 30);
};

/**
 * Returns a validation message for a logged set weight given the exercise
 * classification and the stored body weight, or `undefined` when valid.
 * `weight` is `NaN` when the input was left empty.
 */
export const weightValidationMessage = (
  weight: number | '',
  classification: ExerciseClassification,
  bodyWeight: null | number,
): string | undefined => {
  const isEmpty = Number.isNaN(weight) || weight === '';

  if (classification === 'standard') {
    if (isEmpty || !Number.isFinite(weight) || weight <= 0) {
      return 'Weight must be greater than 0';
    }

    return undefined;
  }

  if ((isEmpty || weight === 0) && bodyWeight === null) {
    return 'Body weight not set — add it in Settings to log this exercise';
  }

  return undefined;
};
