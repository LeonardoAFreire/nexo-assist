import { z } from 'zod';
import { ticketAffectedSchema } from '../tickets/ticket-affected.js';
import { ticketCategorySchema } from '../tickets/ticket-category.js';

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 2000;

export const editPendingActionRequestSchema = z
  .strictObject({
    title: z.string().trim().min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH).optional(),
    description: z
      .string()
      .trim()
      .min(DESCRIPTION_MIN_LENGTH)
      .max(DESCRIPTION_MAX_LENGTH)
      .optional(),
    category: ticketCategorySchema.optional(),
    affected: ticketAffectedSchema.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para editar.',
  });

export type EditPendingActionRequest = z.infer<typeof editPendingActionRequestSchema>;
