import { z } from 'zod';

export const userRoleSchema = z.enum(['employee', 'analyst']);

export type UserRole = z.infer<typeof userRoleSchema>;
