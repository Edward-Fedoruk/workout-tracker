export type ExerciseClassification = 'assisted' | 'bodyweight' | 'standard';

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
