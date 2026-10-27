import { z } from 'zod';

export const TICKET_NUMBER_PATTERN = /^(INC|REQ)-\d{5}$/;

export const ticketNumberSchema = z.string().regex(TICKET_NUMBER_PATTERN);

export type TicketNumber = z.infer<typeof ticketNumberSchema>;
