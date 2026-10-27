import {
  type ApiErrorCode,
  TicketNotFoundError,
  TicketRuleViolationError,
  TicketsUnavailableError,
} from '@nexo/contracts';
import { ChatRuleError } from '../errors/chat-rule.error.js';

const AGENT_UNAVAILABLE_MESSAGE =
  'Não consegui responder agora. Tente de novo ou fale com um analista.';
const BUDGET_EXHAUSTED_MESSAGE =
  'O limite diário de uso do assistente foi atingido. Fale com um analista.';

export type TurnFailure = {
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
};

export class AgentTurnFailedError extends Error {
  constructor(
    readonly code: 'agent_unavailable' | 'budget_exhausted',
    readonly retryable: boolean,
  ) {
    super(code === 'budget_exhausted' ? BUDGET_EXHAUSTED_MESSAGE : AGENT_UNAVAILABLE_MESSAGE);
    this.name = 'AgentTurnFailedError';
  }
}

export function describeFailure(error: unknown): TurnFailure {
  if (error instanceof AgentTurnFailedError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }
  if (error instanceof TicketsUnavailableError) {
    return { code: 'tickets_unavailable', message: error.message, retryable: true };
  }
  if (error instanceof TicketNotFoundError) {
    return { code: 'not_found', message: error.message, retryable: false };
  }
  if (error instanceof TicketRuleViolationError) {
    return { code: 'ticket_rule_violation', message: error.message, retryable: false };
  }
  if (error instanceof ChatRuleError) {
    return { code: error.code, message: error.message, retryable: false };
  }
  return { code: 'agent_unavailable', message: AGENT_UNAVAILABLE_MESSAGE, retryable: true };
}

export function asConfirmationError(error: unknown): unknown {
  const isKnown =
    error instanceof ChatRuleError ||
    error instanceof TicketNotFoundError ||
    error instanceof TicketRuleViolationError;
  return isKnown ? error : new TicketsUnavailableError({ cause: error });
}
