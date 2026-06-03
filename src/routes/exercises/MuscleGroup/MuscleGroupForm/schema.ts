import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const schema = z.object({
  color: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or fewer'),
});

export type FormValues = z.infer<typeof schema>;

export const resolver = zodResolver(schema);
