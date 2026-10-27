import type { ArticleExcerpt } from '@nexo/contracts';
import { toArticleExcerpt } from './article-excerpt.js';
import type { ArticleRepository } from './article-repository.js';
import { buildSearchQuery } from './search-text.js';

export const MAX_SEARCH_LIMIT = 10;

export type SearchArticlesInput = {
  query: string;
  limit: number;
};

export class SearchArticles {
  constructor(private readonly articles: ArticleRepository) {}

  async execute(input: SearchArticlesInput): Promise<ArticleExcerpt[]> {
    const query = buildSearchQuery(input.query);
    const limit = Math.min(Math.floor(input.limit), MAX_SEARCH_LIMIT);
    if (query === '' || limit < 1) {
      return [];
    }
    const found = await this.articles.search({ query, limit });
    return found.map(toArticleExcerpt);
  }
}
