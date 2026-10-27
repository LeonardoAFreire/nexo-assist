import { TicketsUnavailableError } from '@nexo/contracts';
import { ZodError } from 'zod';
import { ArticleNotSearchedError } from './tools/article-not-searched.error.js';

const SINGLE_ATTEMPT = 1;
const GENERIC_FAILURE_RESULT = 'não foi possível concluir este passo';
const INVALID_ARGUMENTS_RESULT = 'argumentos inválidos';
const ARTICLE_NOT_SEARCHED_RESULT = 'artigo fora da busca deste turno';

function attemptsLabel(attempts: number): string {
  return attempts === SINGLE_ATTEMPT ? '1 tentativa' : `${attempts} tentativas`;
}

export function describeStepFailure(error: unknown, attempts: number): string {
  if (error instanceof TicketsUnavailableError) {
    return `sistema de chamados indisponível após ${attemptsLabel(attempts)}`;
  }
  if (error instanceof ArticleNotSearchedError) {
    return ARTICLE_NOT_SEARCHED_RESULT;
  }
  if (error instanceof ZodError) {
    return INVALID_ARGUMENTS_RESULT;
  }
  return GENERIC_FAILURE_RESULT;
}
