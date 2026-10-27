import { z } from 'zod';

export const ticketCategorySchema = z.enum([
  'access',
  'network_vpn',
  'hardware',
  'software',
  'email',
  'other',
]);

export type TicketCategory = z.infer<typeof ticketCategorySchema>;
