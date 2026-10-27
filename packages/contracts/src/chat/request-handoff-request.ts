import { z } from 'zod';

export const requestHandoffRequestSchema = z.strictObject({
  reason: z.literal('requested'),
});

export type RequestHandoffRequest = z.infer<typeof requestHandoffRequestSchema>;
