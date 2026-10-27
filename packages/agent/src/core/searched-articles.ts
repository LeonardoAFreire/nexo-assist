import type { ArticleExcerpt } from '@nexo/contracts';

export class SearchedArticles {
  private readonly articlesById = new Map<string, ArticleExcerpt>();

  remember(articles: ArticleExcerpt[]): void {
    for (const article of articles) {
      this.articlesById.set(article.id, article);
    }
  }

  find(articleId: string): ArticleExcerpt | undefined {
    return this.articlesById.get(articleId);
  }
}
