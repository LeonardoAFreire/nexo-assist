import type { TicketLatestEvent } from '@nexo/contracts';

export type TicketEventKind =
  | 'created'
  | 'complemented'
  | 'status_changed'
  | 'reopened'
  | 'handed_off';

export type TicketEvent = {
  kind: TicketEventKind;
  body: string;
  idempotencyKey: string | null;
  actor: string;
  occurredAt: string;
};

export const SYSTEM_ACTOR = 'system';

const EVENT_LABELS: Record<Exclude<TicketEventKind, 'status_changed'>, string> = {
  created: 'Chamado aberto',
  complemented: 'Complemento registrado',
  reopened: 'Chamado reaberto',
  handed_off: 'Transferido para um analista',
};

export function eventLabel(event: TicketEvent): string {
  if (event.kind === 'status_changed') {
    return event.body;
  }
  return EVENT_LABELS[event.kind];
}

export function toLatestEvent(event: TicketEvent): TicketLatestEvent {
  return { kind: event.kind, at: event.occurredAt, label: eventLabel(event) };
}
