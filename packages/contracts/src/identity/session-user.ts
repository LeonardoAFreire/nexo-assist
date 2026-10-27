import { z } from 'zod';
import { sessionInfoSchema } from './session-info.js';
import { userProfileSchema } from './user-profile.js';

export const sessionUserSchema = userProfileSchema.extend({
  email: z.email(),
  session: sessionInfoSchema,
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
