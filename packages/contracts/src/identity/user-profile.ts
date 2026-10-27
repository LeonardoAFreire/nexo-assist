import { z } from 'zod';
import { supportLevelSchema } from './support-level.js';
import { userRoleSchema } from './user-role.js';

export const userProfileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: userRoleSchema,
  department: z.string().nullable(),
  supportLevel: supportLevelSchema.nullable(),
  initials: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
