import type { TicketType } from '@nexo/contracts';
import type { TicketEvent } from './ticket-event.js';
import type { TicketRecord } from './ticket-record.js';

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');

export type RequesterTicketKey = {
  requesterId: string;
  number: string;
};

export type RequesterIdempotencyKey = {
  requesterId: string;
  idempotencyKey: string;
};

export type RequesterSearch = {
  requesterId: string;
  query: string;
};

export type TicketSave = {
  ticket: TicketRecord;
  event: TicketEvent;
};

export interface TicketRepository {
  listByRequester(requesterId: string): Promise<TicketRecord[]>;
  search(input: RequesterSearch): Promise<TicketRecord[]>;
  findByNumber(input: RequesterTicketKey): Promise<TicketRecord | null>;
  findByIdempotencyKey(input: RequesterIdempotencyKey): Promise<TicketRecord | null>;
  save(input: TicketSave): Promise<void>;
  nextSequence(type: TicketType): Promise<number>;
}
