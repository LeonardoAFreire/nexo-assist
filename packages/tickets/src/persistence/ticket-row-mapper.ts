import {
  ticketAffectedSchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  ticketStatusSchema,
  ticketTypeSchema,
} from '@nexo/contracts';
import { toLatestEvent, type TicketEvent, type TicketEventKind } from '../core/ticket-event.js';
import type { TicketRecord } from '../core/ticket-record.js';
import { ticketEventsTable } from './ticket-events.table.js';
import { ticketsTable } from './tickets.table.js';

export type TicketRow = typeof ticketsTable.$inferSelect;
export type TicketEventRow = typeof ticketEventsTable.$inferSelect;

const EVENT_KINDS: readonly TicketEventKind[] = [
  'created',
  'complemented',
  'status_changed',
  'reopened',
  'handed_off',
];

function toEventKind(value: string): TicketEventKind {
  const kind = EVENT_KINDS.find((candidate: TicketEventKind) => candidate === value);
  if (kind === undefined) {
    throw new Error(`Tipo de evento de chamado desconhecido: ${value}`);
  }
  return kind;
}

export function toTicketEvent(row: TicketEventRow): TicketEvent {
  return {
    kind: toEventKind(row.kind),
    body: row.body,
    idempotencyKey: row.idempotencyKey,
    actor: row.actor,
    occurredAt: row.occurredAt.toISOString(),
  };
}

export function toTicketRecord(row: TicketRow, latest: TicketEventRow | undefined): TicketRecord {
  return {
    number: row.number,
    type: ticketTypeSchema.parse(row.type),
    title: row.title,
    description: row.description,
    category: ticketCategorySchema.parse(row.category),
    priority: ticketPrioritySchema.parse(row.priority),
    affected: ticketAffectedSchema.parse(row.affected),
    status: ticketStatusSchema.parse(row.status),
    openedAt: row.openedAt.toISOString(),
    lastUpdatedAt: row.lastUpdatedAt.toISOString(),
    resolvedAt: row.resolvedAt === null ? null : row.resolvedAt.toISOString(),
    dueAt: null,
    overdue: false,
    latestEvent: latest === undefined ? null : toLatestEvent(toTicketEvent(latest)),
    requesterId: row.requesterId,
  };
}

export function toTicketRow(record: TicketRecord): TicketRow {
  return {
    number: record.number,
    type: record.type,
    requesterId: record.requesterId,
    title: record.title,
    description: record.description,
    category: record.category,
    priority: record.priority,
    affected: record.affected,
    status: record.status,
    openedAt: new Date(record.openedAt),
    lastUpdatedAt: new Date(record.lastUpdatedAt),
    resolvedAt: record.resolvedAt === null ? null : new Date(record.resolvedAt),
  };
}

export function toEventRow(
  number: string,
  event: TicketEvent,
): typeof ticketEventsTable.$inferInsert {
  return {
    ticketNumber: number,
    kind: event.kind,
    body: event.body,
    idempotencyKey: event.idempotencyKey,
    actor: event.actor,
    occurredAt: new Date(event.occurredAt),
  };
}
