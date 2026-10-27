import type { PendingAction } from '@nexo/contracts';
import type { PendingActionRecord } from './pending-action-record.js';

export function toPendingAction(record: PendingActionRecord): PendingAction {
  return {
    id: record.id,
    displayNumber: record.displayNumber,
    kind: record.kind,
    status: record.status,
    draft: record.draft,
    targetNumber: record.targetNumber,
    complement: record.complement,
    resultTicket: record.resultTicket,
    confirmedVia: record.confirmedVia,
    createdAt: record.createdAt,
    resolvedAt: record.resolvedAt,
  };
}
