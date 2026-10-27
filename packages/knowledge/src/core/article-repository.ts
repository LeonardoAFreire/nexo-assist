import type { Article } from './article.js';

export const ARTICLE_REPOSITORY = Symbol('ARTICLE_REPOSITORY');

export interface ArticleRepository {
  search(input: { query: string; limit: number }): Promise<Article[]>;
  findById(articleId: string): Promise<Article | null>;
  count(): Promise<number>;
  insertMany(articles: Article[]): Promise<void>;
}
