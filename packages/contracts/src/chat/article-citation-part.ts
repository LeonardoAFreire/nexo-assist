import { z } from 'zod';

export const articleCitationPartSchema = z.object({
  type: z.literal('article_citation'),
  articleId: z.string(),
  title: z.string(),
  applies: z.boolean(),
  reason: z.string(),
});

export type ArticleCitationPart = z.infer<typeof articleCitationPartSchema>;
