import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';

export const sessionInfoSchema = z.object({
  expiresAt: isoDateTimeSchema,
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;
