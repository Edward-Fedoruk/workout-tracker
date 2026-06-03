import { weightValidationMessage } from '@/utils/erm';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const setSchema = z.object({
  reps: z.union([z.number(), z.nan()]),
  weight: z.union([z.number(), z.nan()]),
});

export const schema = z
  .object({
    bodyWeight: z.number().nullable(),
    exercises: z.array(
      z.object({
        classification: z.enum(['standard', 'bodyweight']),
        exerciseName: z.string(),
        sets: z.array(setSchema),
      }),
    ),
  })
  .superRefine((data, context) => {
    for (const [exerciseIndex, exercise] of data.exercises.entries()) {
      for (const [setIndex, set] of exercise.sets.entries()) {
        const isRepsEmpty = Number.isNaN(set.reps);
        const isWeightEmpty = Number.isNaN(set.weight);
        // A fully empty row is skipped — it simply won't be logged.
        if (isRepsEmpty && isWeightEmpty) {
          continue;
        }

        if (!Number.isInteger(set.reps) || set.reps <= 0) {
          context.addIssue({
            code: 'custom',
            message: 'Reps must be greater than 0',
            path: ['exercises', exerciseIndex, 'sets', setIndex, 'reps'],
          });
        }

        const weightMessage = weightValidationMessage(
          set.weight,
          exercise.classification,
          data.bodyWeight,
        );
        if (weightMessage !== undefined) {
          context.addIssue({
            code: 'custom',
            message: weightMessage,
            path: ['exercises', exerciseIndex, 'sets', setIndex, 'weight'],
          });
        }
      }
    }
  });

export type FormValues = z.infer<typeof schema>;

export const resolver = zodResolver(schema);
