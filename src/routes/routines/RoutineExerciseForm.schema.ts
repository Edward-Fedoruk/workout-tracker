import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const schema = z
  .object({
    maxReps: z
      .number({ error: 'Max reps must be between 1 and 99' })
      .int('Max reps must be between 1 and 99')
      .min(1, 'Max reps must be between 1 and 99')
      .max(99, 'Max reps must be between 1 and 99'),
    minReps: z
      .number({ error: 'Min reps must be between 1 and 99' })
      .int('Min reps must be between 1 and 99')
      .min(1, 'Min reps must be between 1 and 99')
      .max(99, 'Min reps must be between 1 and 99'),
    name: z.string().trim().min(1, 'Exercise name is required'),
    sets: z
      .number({ error: 'Sets must be between 1 and 5' })
      .int('Sets must be between 1 and 5')
      .min(1, 'Sets must be between 1 and 5')
      .max(5, 'Sets must be between 1 and 5'),
  })
  .superRefine((data, context) => {
    const isMinValid =
      Number.isInteger(data.minReps) && data.minReps >= 1 && data.minReps <= 99;
    const isMaxValid =
      Number.isInteger(data.maxReps) && data.maxReps >= 1 && data.maxReps <= 99;

    if (isMinValid && isMaxValid && data.minReps > data.maxReps) {
      context.addIssue({
        code: 'custom',
        message: 'Max reps must be ≥ min reps',
        path: ['maxReps'],
      });
    }
  });

export type FormValues = z.infer<typeof schema>;

export const resolver = zodResolver(schema);
