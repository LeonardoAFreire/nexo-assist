import { z } from 'zod';

export const eventPartSchema = z.object({
  type: z.literal('event'),
  kind: z.enum(['handed_off', 'claimed', 'released', 'closed', 'limit_reached']),
  label: z.string(),
  actorName: z.string().nullable(),
});

export type EventPart = z.infer<typeof eventPartSchema>;
