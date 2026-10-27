import { HttpStatus } from '@nestjs/common';
import { TicketNotFoundError, TicketsUnavailableError } from '@nexo/contracts';
import { ApiHttpException } from '@nexo/shared/http';

export function ticketNotFound(): ApiHttpException {
  return new ApiHttpException({
    code: 'not_found',
    message: new TicketNotFoundError().message,
    status: HttpStatus.NOT_FOUND,
  });
}

export function toHttpError(error: unknown): unknown {
  if (error instanceof TicketsUnavailableError) {
    return new ApiHttpException({
      code: 'tickets_unavailable',
      message: error.message,
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
  }
  if (error instanceof TicketNotFoundError) {
    return ticketNotFound();
  }
  return error;
}

export async function mapTicketErrors<TResult>(
  operation: () => Promise<TResult>,
): Promise<TResult> {
  try {
    return await operation();
  } catch (error: unknown) {
    throw toHttpError(error);
  }
}
