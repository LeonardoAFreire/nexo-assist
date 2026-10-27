import { ARTICLE_EXCERPT_MAX_LENGTH } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import type { Article } from './article.js';
import { toArticleExcerpt } from './article-excerpt.js';

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'artigo',
    title: 'Título',
    body: 'Texto curto.',
    conditions: 'Só no Windows 10',
    category: 'software',
    ...overrides,
  };
}

describe('toArticleExcerpt', () => {
  it('mantém o corpo curto e preserva as condições de aplicação', () => {
    expect(toArticleExcerpt(makeArticle())).toEqual({
      id: 'artigo',
      title: 'Título',
      excerpt: 'Texto curto.',
      conditions: 'Só no Windows 10',
      category: 'software',
    });
  });

  it('corta o corpo longo em até 600 caracteres sem partir palavras', () => {
    const body = 'palavra '.repeat(200);
    const { excerpt } = toArticleExcerpt(makeArticle({ body }));
    expect(excerpt.length).toBeLessThanOrEqual(ARTICLE_EXCERPT_MAX_LENGTH);
    expect(excerpt.endsWith('palavra…')).toBe(true);
  });

  it('corta no limite exato quando o texto não tem espaços', () => {
    const { excerpt } = toArticleExcerpt(makeArticle({ body: 'a'.repeat(1000) }));
    expect(excerpt).toHaveLength(ARTICLE_EXCERPT_MAX_LENGTH);
  });

  it('devolve conditions nulo quando o artigo vale para todos', () => {
    expect(toArticleExcerpt(makeArticle({ conditions: null })).conditions).toBeNull();
  });
});
