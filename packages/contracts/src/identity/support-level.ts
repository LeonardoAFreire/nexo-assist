import { z } from 'zod';

export const supportLevelSchema = z.enum(['N1', 'N2']);

export type SupportLevel = z.infer<typeof supportLevelSchema>;
