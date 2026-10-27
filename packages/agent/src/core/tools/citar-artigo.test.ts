import { describe, expect, it } from 'vitest';
import { makeArticle } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { ArticleNotSearchedError } from './article-not-searched.error.js';
import { createCitarArtigoTool } from './citar-artigo.js';

const citation = { articleId: 'vpn-erro-809', applies: false, reason: 'vale só para Windows 10' };

describe('citar_artigo', () => {
  it('recusa artigo que não veio da busca do turno e não emite citação', async () => {
    const { context, events } = makeTurnContext();
    const result = createCitarArtigoTool().execute(citation, context);
    await expect(result).rejects.toBeInstanceOf(ArticleNotSearchedError);
    expect(events).toEqual([]);
  });

  it('emite a citação do artigo encontrado na busca do turno', async () => {
    const { context, events } = makeTurnContext();
    context.articles.remember([makeArticle()]);
    const output = await createCitarArtigoTool().execute(citation, context);
    expect(output.title).toBe('VPN com erro 809');
    expect(events).toEqual([
      {
        type: 'part',
        part: {
          type: 'article_citation',
          articleId: 'vpn-erro-809',
          title: 'VPN com erro 809',
          applies: false,
          reason: 'vale só para Windows 10',
        },
      },
    ]);
  });

  it('descreve se o artigo se aplica', () => {
    const tool = createCitarArtigoTool();
    const output = { ...citation, title: 'VPN com erro 809', applies: true };
    expect(tool.stepResult(citation, output)).toBe(
      "artigo 'VPN com erro 809' se aplica: vale só para Windows 10",
    );
  });

  it('rejeita argumentos extras e motivo vazio', () => {
    const { inputSchema } = createCitarArtigoTool();
    expect(inputSchema.safeParse({ ...citation, title: 'inventado' }).success).toBe(false);
    expect(inputSchema.safeParse({ ...citation, reason: '' }).success).toBe(false);
  });
});
