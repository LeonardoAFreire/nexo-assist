import { z } from 'zod';

export const pendingActionKindSchema = z.enum([
  'create_ticket',
  'complement_ticket',
  'reopen_ticket',
]);

export type PendingActionKind = z.infer<typeof pendingActionKindSchema>;
