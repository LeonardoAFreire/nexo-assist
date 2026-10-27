import { describe, expect, it } from 'vitest';
import { evalArticles } from './articles.js';
import { EvalKnowledgeApi } from './eval-knowledge-api.js';

const LIMIT = 3;

async function topIds(query: string): Promise<string[]> {
  const found = await new EvalKnowledgeApi(evalArticles).search({ query, limit: LIMIT });
  return found.map((article) => article.id);
}

describe('EvalKnowledgeApi', () => {
  it('ignora acentos, palavras vazias e variações de flexão', async () => {
    const ids = await topIds('Qual o horário de atendimento do service desk?');
    expect(ids[0]).toBe('horario-service-desk');
  });

  it('ordena pelos artigos que mais combinam com a consulta', async () => {
    const ids = await topIds('VPN com erro 809 no Windows 11');
    expect(ids[0]).toBe('vpn-erro-809');
  });

  it('não devolve artigo quando nada combina', async () => {
    expect(await topIds('xyzzy plugh')).toEqual([]);
  });

  it('busca o artigo pelo identificador', async () => {
    const api = new EvalKnowledgeApi(evalArticles);
    expect(await api.get({ articleId: 'wifi-visitantes' })).toMatchObject({
      id: 'wifi-visitantes',
    });
    expect(await api.get({ articleId: 'inexistente' })).toBeNull();
  });
});
