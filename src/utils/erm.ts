export type ExerciseClassification = 'assisted' | 'bodyweight' | 'standard';

export const computeEffectiveWeight = (parameters: {
  bodyWeight: null | number;
  classification: ExerciseClassification;
  loggedWeight: number;
}): null | number => {
  const { bodyWeight, classification, loggedWeight } = parameters;

  let effective: number;
  if (classification === 'standard') {
    effective = loggedWeight;
  } else {
    if (bodyWeight === null) {
      return null;
    }

    effective = bodyWeight + loggedWeight;
  }

  if (effective <= 0) {
    return null;
  }

  return effective;
};

export const computeERM = (effectiveWeight: number, reps: number): number => {
  return effectiveWeight * (1 + reps / 30);
};
