import type { ArticleExcerpt, KnowledgeApi } from '@nexo/contracts';

const TERM_SEPARATOR = /\s+/;

export class InMemoryKnowledgeApi implements KnowledgeApi {
  constructor(private readonly articles: ArticleExcerpt[]) {}

  async search(input: Parameters<KnowledgeApi['search']>[0]): Promise<ArticleExcerpt[]> {
    const terms = input.query.toLowerCase().split(TERM_SEPARATOR);
    const matches = this.articles.filter((article) => {
      const text = `${article.title} ${article.excerpt}`.toLowerCase();
      return terms.some((term) => text.includes(term));
    });
    return matches.slice(0, input.limit);
  }

  async get(input: Parameters<KnowledgeApi['get']>[0]): Promise<ArticleExcerpt | null> {
    return this.articles.find((article) => article.id === input.articleId) ?? null;
  }
}
