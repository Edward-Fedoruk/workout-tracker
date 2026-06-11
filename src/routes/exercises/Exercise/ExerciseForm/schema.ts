import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const schema = z.object({
  classification: z.enum(['standard', 'bodyweight']),
  imageFilename: z.string().nullable().optional(),
  muscleGroupIds: z
    .array(z.number())
    .min(1, 'Select at least one muscle group'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
});

export type FormValues = z.infer<typeof schema>;

export const resolver = zodResolver(schema);
