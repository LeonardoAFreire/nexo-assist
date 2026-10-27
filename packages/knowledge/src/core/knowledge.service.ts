import type { ArticleExcerpt, KnowledgeApi } from '@nexo/contracts';
import { toArticleExcerpt } from './article-excerpt.js';
import type { ArticleRepository } from './article-repository.js';
import type { SearchArticles } from './search-articles.js';

export class KnowledgeService implements KnowledgeApi {
  constructor(
    private readonly searchArticles: SearchArticles,
    private readonly articles: ArticleRepository,
  ) {}

  search(input: { query: string; limit: number }): Promise<ArticleExcerpt[]> {
    return this.searchArticles.execute(input);
  }

  async get(input: { articleId: string }): Promise<ArticleExcerpt | null> {
    const article = await this.articles.findById(input.articleId);
    return article === null ? null : toArticleExcerpt(article);
  }
}
