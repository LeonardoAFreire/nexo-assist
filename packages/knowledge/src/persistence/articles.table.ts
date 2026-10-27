import { customType, pgSchema, text } from 'drizzle-orm/pg-core';

export const KNOWLEDGE_SCHEMA = 'knowledge';

const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
});

export const knowledgeSchema = pgSchema(KNOWLEDGE_SCHEMA);

export const articlesTable = knowledgeSchema.table('articles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  conditions: text('conditions'),
  category: text('category').notNull(),
  searchVector: tsvector('search_vector'),
});
