import { DEMO_EMPLOYEES, type TicketDetail } from '@nexo/contracts';
import type { OwnedTicket } from '../../src/persistence/scripted/in-memory-tickets-api.js';
import type { EvalWorld } from '../types.js';
import { anaTicketSpecs } from './ana-ticket-specs.js';
import { otherTicketSpecs } from './other-ticket-specs.js';
import type { EvalTicketSpec } from './ticket-spec.js';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const REQUEST_PREFIX = 'REQ';
const OVERDUE_DAYS = 2;
const PENDING_DAYS = 2;

export type EvalRequester = { id: string; name: string };

export type EvalWorldData = {
  requester: EvalRequester;
  owned: OwnedTicket[];
  world: EvalWorld;
};

export function findRequester(name: string): EvalRequester {
  const employee = DEMO_EMPLOYEES.find((candidate) => candidate.name === name);
  if (employee === undefined) {
    throw new Error(`Funcionário de exemplo não encontrado: ${name}`);
  }
  return { id: employee.id, name: employee.name };
}

function daysFrom(now: Date, days: number): string {
  return new Date(now.getTime() + days * MILLISECONDS_PER_DAY).toISOString();
}

function toDetail(spec: EvalTicketSpec, now: Date): TicketDetail {
  const resolved = spec.status === 'resolved';
  const lastUpdatedAt = daysFrom(now, -spec.updatedDaysAgo);
  const dueDays = spec.overdue ? -OVERDUE_DAYS : PENDING_DAYS;
  return {
    number: spec.number,
    type: spec.number.startsWith(REQUEST_PREFIX) ? 'request' : 'incident',
    title: spec.title,
    category: spec.category,
    priority: spec.priority,
    status: spec.status,
    openedAt: daysFrom(now, -spec.openedDaysAgo),
    lastUpdatedAt,
    resolvedAt: resolved ? lastUpdatedAt : null,
    dueAt: resolved ? null : daysFrom(now, dueDays),
    overdue: spec.overdue ?? false,
    latestEvent: null,
    description: spec.description,
    affected: spec.affected ?? 'only_me',
  };
}

export function buildEvalWorld(requesterName: string, now: Date): EvalWorldData {
  const requester = findRequester(requesterName);
  const specs = [...anaTicketSpecs, ...otherTicketSpecs];
  const owned = specs.map((spec) => ({
    requesterId: findRequester(spec.owner).id,
    ticket: toDetail(spec, now),
  }));
  const own = owned.filter((entry) => entry.requesterId === requester.id);
  const foreign = owned.filter((entry) => entry.requesterId !== requester.id);
  const world = {
    requesterId: requester.id,
    ownedNumbers: own.map((entry) => entry.ticket.number),
    foreignTitles: foreign.map((entry) => entry.ticket.title),
  };
  return { requester, owned, world };
}
