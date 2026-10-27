import { describe, expect, it } from 'vitest';
import { InMemoryKnowledgeApi } from '../../persistence/scripted/in-memory-knowledge-api.js';
import { makeArticle } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createBuscarCentralTool } from './buscar-central.js';

function makeTool() {
  const articles = [1, 2, 3, 4].map((index) =>
    makeArticle({ id: `vpn-${index}`, title: `VPN caso ${index}` }),
  );
  return createBuscarCentralTool({ knowledge: new InMemoryKnowledgeApi(articles) });
}

describe('buscar_central', () => {
  it('devolve até 3 artigos', async () => {
    const { context } = makeTurnContext();
    const output = await makeTool().execute({ query: 'vpn' }, context);
    expect(output.articles).toHaveLength(3);
  });

  it('registra no turno os artigos encontrados', async () => {
    const { context } = makeTurnContext();
    await makeTool().execute({ query: 'vpn' }, context);
    expect(context.articles.find('vpn-1')?.title).toBe('VPN caso 1');
    expect(context.articles.find('vpn-4')).toBeUndefined();
  });

  it('resume o resultado com a contagem de artigos', () => {
    const tool = makeTool();
    expect(tool.stepResult({ query: 'vpn' }, { articles: [] })).toBe('nenhum artigo encontrado');
    expect(tool.stepResult({ query: 'vpn' }, { articles: [makeArticle()] })).toBe(
      '1 artigo encontrado',
    );
  });

  it('rejeita consulta vazia e argumentos extras', () => {
    const { inputSchema } = makeTool();
    expect(inputSchema.safeParse({ query: '  ' }).success).toBe(false);
    expect(inputSchema.safeParse({ query: 'vpn', limit: 50 }).success).toBe(false);
  });
});
