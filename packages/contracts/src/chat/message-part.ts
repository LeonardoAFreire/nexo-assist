import { z } from 'zod';
import { articleCitationPartSchema } from './article-citation-part.js';
import { eventPartSchema } from './event-part.js';
import { pendingActionPartSchema } from './pending-action-part.js';
import { quickOptionsPartSchema } from './quick-options-part.js';
import { ticketCardPartSchema } from './ticket-card-part.js';
import { ticketSelectionPartSchema } from './ticket-selection-part.js';

export const messagePartSchema = z.discriminatedUnion('type', [
  quickOptionsPartSchema,
  ticketSelectionPartSchema,
  ticketCardPartSchema,
  pendingActionPartSchema,
  articleCitationPartSchema,
  eventPartSchema,
]);

export type MessagePart = z.infer<typeof messagePartSchema>;
