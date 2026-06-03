import { type ExerciseClassification } from '@/utils/erm';

export const getToday = (): string => new Date().toISOString().slice(0, 10);

export const getWeightInputMin = (
  classification: ExerciseClassification,
): string | undefined => {
  if (classification === 'standard') {
    return '0.1';
  }

  if (classification === 'bodyweight') {
    return '0';
  }

  return undefined;
};
