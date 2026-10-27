import { z } from 'zod';

export const heartbeatEventSchema = z.object({
  event: z.literal('heartbeat'),
  data: z.object({}),
});

export type HeartbeatEvent = z.infer<typeof heartbeatEventSchema>;
