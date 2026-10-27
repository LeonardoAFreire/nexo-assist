import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';
import { ArticleNotSearchedError } from './article-not-searched.error.js';

const ARTICLE_ID_MAX_LENGTH = 100;
const REASON_MAX_LENGTH = 300;

const inputSchema = z.strictObject({
  articleId: z.string().min(1).max(ARTICLE_ID_MAX_LENGTH),
  applies: z.boolean(),
  reason: z.string().trim().min(1).max(REASON_MAX_LENGTH),
});
const outputSchema = z.object({
  articleId: z.string(),
  title: z.string(),
  applies: z.boolean(),
  reason: z.string(),
});

export type CitarArtigoInput = z.infer<typeof inputSchema>;
export type CitarArtigoOutput = z.infer<typeof outputSchema>;

function citeArticle(input: CitarArtigoInput, context: TurnContext): CitarArtigoOutput {
  const article = context.articles.find(input.articleId);
  if (!article) {
    throw new ArticleNotSearchedError();
  }
  const citation = { ...input, title: article.title };
  context.emit({ type: 'part', part: { type: 'article_citation', ...citation } });
  return citation;
}

export function createCitarArtigoTool(): AgentTool<CitarArtigoInput, CitarArtigoOutput> {
  return {
    name: 'citar_artigo',
    description:
      'Cita para o funcionário um artigo que veio da busca na central de ajuda deste turno, informando se ele se aplica ao caso e por quê.',
    stepKind: 'cited_article',
    failureLabel: 'avaliou um artigo',
    inputSchema,
    outputSchema,
    stepLabel: () => 'avaliou o artigo',
    stepResult: (_input, output) =>
      `artigo '${output.title}' ${output.applies ? 'se aplica' : 'não se aplica'}: ${output.reason}`,
    execute: async (input, context) => citeArticle(input, context),
  };
}
