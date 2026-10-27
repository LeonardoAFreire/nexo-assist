import type { Article } from '../../core/article.js';
import { networkArticles } from './network-articles.js';
import { workplaceArticles } from './workplace-articles.js';

export const seedArticles: Article[] = [...networkArticles, ...workplaceArticles];
