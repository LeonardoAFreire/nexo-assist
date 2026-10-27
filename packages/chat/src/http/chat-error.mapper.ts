import { HttpStatus } from '@nestjs/common';
import {
  type ApiErrorCode,
  TicketNotFoundError,
  TicketRuleViolationError,
  TicketsUnavailableError,
} from '@nexo/contracts';
import { ApiHttpException } from '@nexo/shared/http';
import { ChatRuleError } from '../core/errors/chat-rule.error.js';
import { describeFailure } from '../core/send/turn-failure.js';

const STATUS_BY_CODE: Partial<Record<ApiErrorCode, number>> = {
  validation_error: HttpStatus.BAD_REQUEST,
  not_found: HttpStatus.NOT_FOUND,
  conversation_already_claimed: HttpStatus.CONFLICT,
  conversation_not_claimed: HttpStatus.CONFLICT,
  invalid_conversation_state: HttpStatus.CONFLICT,
  pending_action_not_pending: HttpStatus.CONFLICT,
  turn_in_progress: HttpStatus.CONFLICT,
  ticket_rule_violation: HttpStatus.UNPROCESSABLE_ENTITY,
  message_limit_reached: HttpStatus.TOO_MANY_REQUESTS,
  rate_limited: HttpStatus.TOO_MANY_REQUESTS,
  tickets_unavailable: HttpStatus.SERVICE_UNAVAILABLE,
  agent_unavailable: HttpStatus.SERVICE_UNAVAILABLE,
  budget_exhausted: HttpStatus.SERVICE_UNAVAILABLE,
};

export type StatusOverrides = Partial<Record<ApiErrorCode, number>>;

function isDomainError(error: unknown): boolean {
  return (
    error instanceof ChatRuleError ||
    error instanceof TicketsUnavailableError ||
    error instanceof TicketNotFoundError ||
    error instanceof TicketRuleViolationError
  );
}

export function mapChatError(error: unknown, overrides: StatusOverrides = {}): unknown {
  if (!isDomainError(error)) {
    return error;
  }
  const { code, message } = describeFailure(error);
  const status = overrides[code] ?? STATUS_BY_CODE[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  return new ApiHttpException({ code, message, status });
}

export async function withChatErrors<T>(
  work: () => Promise<T>,
  overrides: StatusOverrides = {},
): Promise<T> {
  try {
    return await work();
  } catch (error: unknown) {
    throw mapChatError(error, overrides);
  }
}
