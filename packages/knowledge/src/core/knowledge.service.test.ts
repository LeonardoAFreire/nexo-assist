import { describe, expect, it } from 'vitest';
import type { Article } from './article.js';
import { KnowledgeService } from './knowledge.service.js';
import { MAX_SEARCH_LIMIT, SearchArticles } from './search-articles.js';
import { InMemoryArticleRepository } from './testing/in-memory-article.repository.js';

function makeArticle(id: string): Article {
  return { id, title: id, body: `Corpo de ${id}`, conditions: null, category: 'other' };
}

function makeService(articles: Article[]): {
  service: KnowledgeService;
  repository: InMemoryArticleRepository;
} {
  const repository = new InMemoryArticleRepository(articles);
  return { service: new KnowledgeService(new SearchArticles(repository), repository), repository };
}

describe('KnowledgeService.search', () => {
  it('normaliza a consulta antes de buscar e devolve trechos', async () => {
    const { service, repository } = makeService([makeArticle('a')]);
    const result = await service.search({ query: 'Horário?', limit: 3 });
    expect(repository.searches).toEqual([{ query: 'horario', limit: 3 }]);
    expect(result.map((excerpt) => excerpt.id)).toEqual(['a']);
  });

  it('não consulta o repositório quando a consulta não tem termos', async () => {
    const { service, repository } = makeService([makeArticle('a')]);
    expect(await service.search({ query: '???', limit: 3 })).toEqual([]);
    expect(repository.searches).toEqual([]);
  });

  it('devolve vazio quando o limite não é positivo', async () => {
    const { service } = makeService([makeArticle('a')]);
    expect(await service.search({ query: 'vpn', limit: 0 })).toEqual([]);
  });

  it('limita a quantidade pedida ao máximo permitido', async () => {
    const { service, repository } = makeService([makeArticle('a')]);
    await service.search({ query: 'vpn', limit: 500 });
    expect(repository.searches[0]?.limit).toBe(MAX_SEARCH_LIMIT);
  });
});

describe('KnowledgeService.get', () => {
  it('devolve o trecho do artigo pelo id', async () => {
    const { service } = makeService([makeArticle('a')]);
    expect((await service.get({ articleId: 'a' }))?.excerpt).toBe('Corpo de a');
  });

  it('devolve nulo para um artigo inexistente', async () => {
    const { service } = makeService([]);
    expect(await service.get({ articleId: 'x' })).toBeNull();
  });
});
