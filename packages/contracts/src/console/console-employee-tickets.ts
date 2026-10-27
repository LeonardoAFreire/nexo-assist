import { z } from 'zod';
import { ticketSummarySchema } from '../tickets/ticket-summary.js';

const otherTicketsSchema = z.object({
  open: z.array(ticketSummarySchema),
  closed: z.array(ticketSummarySchema),
});

export const consoleEmployeeTicketsSchema = z.object({
  fromConversation: z.array(ticketSummarySchema),
  others: otherTicketsSchema,
});

export type ConsoleEmployeeTickets = z.infer<typeof consoleEmployeeTicketsSchema>;
