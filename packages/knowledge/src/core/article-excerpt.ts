import { ARTICLE_EXCERPT_MAX_LENGTH, type ArticleExcerpt } from '@nexo/contracts';
import type { Article } from './article.js';

const ELLIPSIS = '…';

function truncate(text: string): string {
  if (text.length <= ARTICLE_EXCERPT_MAX_LENGTH) {
    return text;
  }
  const limit = ARTICLE_EXCERPT_MAX_LENGTH - ELLIPSIS.length;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  const wordBoundary = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${wordBoundary.trimEnd()}${ELLIPSIS}`;
}

export function toArticleExcerpt(article: Article): ArticleExcerpt {
  return {
    id: article.id,
    title: article.title,
    excerpt: truncate(article.body),
    conditions: article.conditions,
    category: article.category,
  };
}
