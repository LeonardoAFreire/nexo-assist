import { pendingActionSchema } from '@nexo/contracts';
import type { z } from 'zod';
import type { PendingActionRecord } from '../core/pending-actions/pending-action-record.js';
import { parseStored, toDate, toIso } from './parse-stored.js';
import type { pendingActionsTable } from './pending-actions.table.js';

export type PendingActionRow = typeof pendingActionsTable.$inferSelect;

const payloadSchema = pendingActionSchema.pick({
  draft: true,
  targetNumber: true,
  complement: true,
  resultTicket: true,
});

export type PendingActionPayload = z.infer<typeof payloadSchema>;

export function toPendingActionRecord(row: PendingActionRow): PendingActionRecord {
  const payload = parseStored({
    schema: payloadSchema,
    value: row.payload,
    origin: `chat.pending_actions ${row.id}`,
  });
  return {
    id: row.id,
    conversationId: row.conversationId,
    displayNumber: row.displayNumber,
    kind: row.kind,
    status: row.status,
    ...payload,
    confirmedVia: row.confirmedVia,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: toIso(row.resolvedAt),
  };
}

export function toPendingActionRow(record: PendingActionRecord): PendingActionRow {
  const payload: PendingActionPayload = {
    draft: record.draft,
    targetNumber: record.targetNumber,
    complement: record.complement,
    resultTicket: record.resultTicket,
  };
  return {
    id: record.id,
    conversationId: record.conversationId,
    displayNumber: record.displayNumber,
    kind: record.kind,
    status: record.status,
    payload,
    resultTicketNumber: record.resultTicket?.number ?? null,
    confirmedVia: record.confirmedVia,
    createdAt: new Date(record.createdAt),
    resolvedAt: toDate(record.resolvedAt),
  };
}
