import { TZDate } from '@date-fns/tz';
import { getHours, isWeekend } from 'date-fns';
import { describe, expect, it } from 'vitest';
import {
  BUSINESS_DAY_END_HOUR,
  BUSINESS_DAY_START_HOUR,
  SERVICE_DESK_TIME_ZONE,
} from '../../core/service-desk-calendar.js';
import { FakeClock } from '../../core/testing/fake-clock.js';
import { createTicketRules } from '../../core/ticket-rules.js';
import { buildSeedSaves } from './build-seed-saves.js';

const MILLISECONDS_PER_HOUR = 3_600_000;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const REOPEN_WINDOW_DAYS = 7;
const SAMPLED_HOURS = 24 * 14;
const FIRST_SAMPLE = Date.parse('2026-10-26T00:00:00.000Z');

function sampledMoments(): Date[] {
  return Array.from(
    { length: SAMPLED_HOURS },
    (_, hour) => new Date(FIRST_SAMPLE + hour * MILLISECONDS_PER_HOUR),
  );
}

function isBusinessMoment(iso: string): boolean {
  const moment = new TZDate(iso, SERVICE_DESK_TIME_ZONE);
  const hour = getHours(moment);
  return !isWeekend(moment) && hour >= BUSINESS_DAY_START_HOUR && hour < BUSINESS_DAY_END_HOUR;
}

function ticketOf(now: Date, number: string) {
  const save = buildSeedSaves(now).find((candidate) => candidate.ticket.number === number);
  if (save === undefined) {
    throw new Error(`Chamado ausente na seed: ${number}`);
  }
  return save.ticket;
}

describe('seed dos chamados de exemplo', () => {
  it('grava todas as datas em horário útil, em qualquer dia do boot', () => {
    for (const now of sampledMoments()) {
      for (const { ticket, event } of buildSeedSaves(now)) {
        expect(isBusinessMoment(ticket.openedAt)).toBe(true);
        expect(isBusinessMoment(ticket.lastUpdatedAt)).toBe(true);
        expect(isBusinessMoment(event.occurredAt)).toBe(true);
        expect(ticket.openedAt <= ticket.lastUpdatedAt).toBe(true);
      }
    }
  });

  it('mantém o INC-20311 vencido, o INC-20150 reabrível e o INC-20402 fora da janela', () => {
    for (const now of sampledMoments()) {
      const { overdue } = createTicketRules(new FakeClock(now));
      const vencido = ticketOf(now, 'INC-20311');
      const subject = { ...vencido, lastUpdatedAt: new Date(vencido.lastUpdatedAt) };
      expect(overdue.isOverdue(subject, now)).toBe(true);
      const resolvedAge = (number: string) =>
        (now.getTime() - Date.parse(ticketOf(now, number).resolvedAt ?? '')) / MILLISECONDS_PER_DAY;
      expect(resolvedAge('INC-20150')).toBeLessThanOrEqual(REOPEN_WINDOW_DAYS);
      expect(resolvedAge('INC-20402')).toBeGreaterThan(REOPEN_WINDOW_DAYS);
    }
  });

  it('registra o evento mais recente depois do evento de abertura', () => {
    const saves = buildSeedSaves(new Date('2026-10-25T10:00:00.000Z'));
    const events = saves.filter((save) => save.ticket.number === 'INC-20298');
    expect(events.map((save) => save.event.kind)).toEqual(['created', 'status_changed']);
    expect(events[0]!.event.occurredAt < events[1]!.event.occurredAt).toBe(true);
  });
});
