import { z } from 'zod';

export const loginRequestSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string(),
  remember: z.boolean().default(false),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
