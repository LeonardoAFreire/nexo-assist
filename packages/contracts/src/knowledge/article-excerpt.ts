import { z } from 'zod';
import { ticketCategorySchema } from '../tickets/ticket-category.js';

export const ARTICLE_EXCERPT_MAX_LENGTH = 600;

export const articleExcerptSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string().max(ARTICLE_EXCERPT_MAX_LENGTH),
  conditions: z.string().nullable(),
  category: ticketCategorySchema,
});

export type ArticleExcerpt = z.infer<typeof articleExcerptSchema>;
