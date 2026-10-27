import { z } from 'zod';

export const loginRequestSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
  remember: z.boolean().default(false),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
