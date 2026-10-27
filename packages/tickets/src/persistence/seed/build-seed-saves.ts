import { SYSTEM_ACTOR, type TicketEvent } from '../../core/ticket-event.js';
import type { TicketRecord } from '../../core/ticket-record.js';
import type { TicketSave } from '../../core/ticket-repository.js';
import { anaTickets } from './ana-tickets.js';
import { businessMomentDaysAgo, businessMomentOnOrBefore } from './business-time.js';
import { otherEmployeesTickets } from './other-tickets.js';
import type { SeedTicketSpec } from './seed-ticket-spec.js';

const RESOLVED_STATUS = 'resolved';
const MILLISECONDS_PER_HOUR = 3_600_000;

function openedMoment(spec: SeedTicketSpec, now: Date, updatedAt: Date): Date {
  const opened = businessMomentDaysAgo(now, spec.openedDaysAgo);
  if (opened < updatedAt || spec.openedDaysAgo === spec.updatedDaysAgo) {
    return opened;
  }
  return businessMomentOnOrBefore(new Date(updatedAt.getTime() - MILLISECONDS_PER_HOUR));
}

function toRecord(spec: SeedTicketSpec, now: Date): TicketRecord {
  const updatedAt = businessMomentDaysAgo(now, spec.updatedDaysAgo);
  const openedAt = openedMoment(spec, now, updatedAt).toISOString();
  const lastUpdatedAt = updatedAt.toISOString();
  return {
    number: spec.number,
    type: spec.type,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    priority: spec.priority,
    affected: spec.affected,
    status: spec.status,
    requesterId: spec.requesterId,
    openedAt,
    lastUpdatedAt,
    resolvedAt: spec.status === RESOLVED_STATUS ? lastUpdatedAt : null,
    dueAt: null,
    overdue: false,
    latestEvent: null,
  };
}

function toEvents(spec: SeedTicketSpec, ticket: TicketRecord): TicketEvent[] {
  const created: TicketEvent = {
    kind: 'created',
    body: spec.title,
    idempotencyKey: null,
    actor: spec.requesterId,
    occurredAt: ticket.openedAt,
  };
  if (spec.openedDaysAgo === spec.updatedDaysAgo) {
    return [created];
  }
  const updated: TicketEvent = {
    kind: 'status_changed',
    body: spec.updateLabel,
    idempotencyKey: null,
    actor: SYSTEM_ACTOR,
    occurredAt: ticket.lastUpdatedAt,
  };
  return [created, updated];
}

export function buildSeedSaves(now: Date): TicketSave[] {
  return [...anaTickets, ...otherEmployeesTickets].flatMap((spec: SeedTicketSpec) => {
    const ticket = toRecord(spec, now);
    return toEvents(spec, ticket).map((event: TicketEvent) => ({ ticket, event }));
  });
}
