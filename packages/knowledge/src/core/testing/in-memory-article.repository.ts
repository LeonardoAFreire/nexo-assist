import type { Article } from '../article.js';
import type { ArticleRepository } from '../article-repository.js';

export class InMemoryArticleRepository implements ArticleRepository {
  readonly searches: { query: string; limit: number }[] = [];

  constructor(private articles: Article[] = []) {}

  search(input: { query: string; limit: number }): Promise<Article[]> {
    this.searches.push(input);
    return Promise.resolve(this.articles.slice(0, input.limit));
  }

  findById(articleId: string): Promise<Article | null> {
    const found = this.articles.find((article: Article) => article.id === articleId);
    return Promise.resolve(found ?? null);
  }

  count(): Promise<number> {
    return Promise.resolve(this.articles.length);
  }

  insertMany(articles: Article[]): Promise<void> {
    this.articles = [...this.articles, ...articles];
    return Promise.resolve();
  }
}
