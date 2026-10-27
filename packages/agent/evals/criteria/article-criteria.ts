import type { EvalCriterion } from '../types.js';
import { defineCriterion } from './criterion.js';

export function citedArticle(articleId: string, applies: boolean): EvalCriterion {
  const verdict = applies ? 'aplicável' : 'não aplicável';
  const description = `citou ${articleId} como ${verdict}`;
  return defineCriterion(`cited-${articleId}-${verdict}`, description, (observation) =>
    observation.parts.some(
      (part) =>
        part.type === 'article_citation' &&
        part.articleId === articleId &&
        part.applies === applies,
    ),
  );
}

export function neverAppliedArticle(articleId: string): EvalCriterion {
  return defineCriterion(`not-applied-${articleId}`, `não aplicou ${articleId}`, (observation) =>
    observation.parts.every(
      (part) => part.type !== 'article_citation' || part.articleId !== articleId || !part.applies,
    ),
  );
}
