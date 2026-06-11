import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const schema = z.object({
  bodyWeight: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
    z
      .number({ error: 'Enter your body weight' })
      .positive('Body weight must be greater than 0'),
  ),
});

export type FormValues = z.infer<typeof schema>;

export const resolver = zodResolver(schema);
