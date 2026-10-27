import type { ArticleExcerpt } from './article-excerpt.js';

export const KNOWLEDGE_API = Symbol('KNOWLEDGE_API');

export interface KnowledgeApi {
  search(input: { query: string; limit: number }): Promise<ArticleExcerpt[]>;
  get(input: { articleId: string }): Promise<ArticleExcerpt | null>;
}
