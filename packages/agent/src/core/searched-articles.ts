import type { ArticleExcerpt } from '@nexo/contracts';

export class SearchedArticles {
  private readonly articlesById = new Map<string, ArticleExcerpt>();
  private readonly citedIds = new Set<string>();

  remember(articles: ArticleExcerpt[]): void {
    for (const article of articles) {
      this.articlesById.set(article.id, article);
    }
  }

  markCited(articleId: string): boolean {
    const alreadyCited = this.citedIds.has(articleId);
    this.citedIds.add(articleId);
    return alreadyCited;
  }

  find(articleId: string): ArticleExcerpt | undefined {
    return this.articlesById.get(articleId);
  }
}
