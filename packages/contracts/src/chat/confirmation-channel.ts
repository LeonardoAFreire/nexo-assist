import { z } from 'zod';

export const confirmationChannelSchema = z.enum(['button', 'shortcut', 'text']);

export type ConfirmationChannel = z.infer<typeof confirmationChannelSchema>;
