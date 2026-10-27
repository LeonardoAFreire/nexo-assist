import {
  type TicketDetail,
  TicketNotFoundError,
  TicketRuleViolationError,
  type TicketsApi,
} from '@nexo/contracts';
import { type ResiliencePolicy, withResilience } from '@nexo/shared/resilience';
import type { PendingActionRecord } from './pending-action-record.js';

const INCOMPLETE_ACTION_MESSAGE = 'Ação pendente sem os dados necessários para a escrita.';

export type TicketWriterApi = Pick<TicketsApi, 'create' | 'complement' | 'reopen'>;

export type TicketWriterDeps = {
  tickets: TicketWriterApi;
  policy: ResiliencePolicy;
};

export type TicketWriteInput = {
  requesterId: string;
  record: PendingActionRecord;
};

type Settled = { ticket: TicketDetail } | { rejection: Error };

export type TicketWriteResult = {
  ticket: TicketDetail;
  attempts: number;
};

export async function writeToTickets(
  deps: TicketWriterDeps,
  input: TicketWriteInput,
): Promise<TicketWriteResult> {
  let failedAttempts = 0;
  const policy: ResiliencePolicy = {
    ...deps.policy,
    onAttemptFailed: (failure) => {
      failedAttempts += 1;
      deps.policy.onAttemptFailed?.(failure);
    },
  };
  const settled = await withResilience(settle(buildCall(deps.tickets, input)), policy);
  if ('rejection' in settled) {
    throw settled.rejection;
  }
  return { ticket: settled.ticket, attempts: failedAttempts + 1 };
}

export function isDefinitiveTicketsError(error: unknown): error is Error {
  return error instanceof TicketNotFoundError || error instanceof TicketRuleViolationError;
}

function settle(call: () => Promise<TicketDetail>): () => Promise<Settled> {
  return async () => {
    try {
      return { ticket: await call() };
    } catch (error: unknown) {
      if (isDefinitiveTicketsError(error)) {
        return { rejection: error };
      }
      throw error;
    }
  };
}

function buildCall(tickets: TicketWriterApi, input: TicketWriteInput): () => Promise<TicketDetail> {
  const { record } = input;
  const base = { requesterId: input.requesterId, idempotencyKey: record.id };
  if (record.kind === 'create_ticket' && record.draft !== null) {
    const draft = record.draft;
    return () => tickets.create({ ...base, draft });
  }
  const { targetNumber, complement } = record;
  if (targetNumber === null || complement === null) {
    throw new Error(INCOMPLETE_ACTION_MESSAGE);
  }
  if (record.kind === 'complement_ticket') {
    return () => tickets.complement({ ...base, number: targetNumber, text: complement });
  }
  return () => tickets.reopen({ ...base, number: targetNumber, reason: complement });
}
