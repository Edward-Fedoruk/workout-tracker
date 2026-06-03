import { getToday } from './workoutFormUtilities';
import { weightValidationMessage } from '@/utils/erm';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const schema = z
  .object({
    bodyWeight: z.number().nullable(),
    classification: z.enum(['standard', 'bodyweight']),
    exerciseName: z.string().trim().min(1, 'Exercise name is required'),
    sets: z
      .array(
        z.object({
          reps: z
            .number({ error: 'Reps must be greater than 0' })
            .int('Reps must be greater than 0')
            .positive('Reps must be greater than 0'),
          weight: z.union([z.number(), z.nan()]),
        }),
      )
      .min(1, 'Must have at least 1 set'),
    workoutDate: z
      .string()
      .refine((value) => value <= getToday(), 'Cannot log future workouts'),
  })
  .superRefine((data, context) => {
    for (const [index, set] of data.sets.entries()) {
      const message = weightValidationMessage(
        set.weight,
        data.classification,
        data.bodyWeight,
      );
      if (message !== undefined) {
        context.addIssue({
          code: 'custom',
          message,
          path: ['sets', index, 'weight'],
        });
      }
    }
  });

export type FormValues = z.infer<typeof schema>;

export const resolver = zodResolver(schema);
