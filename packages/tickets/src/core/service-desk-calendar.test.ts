import { describe, expect, it } from 'vitest';
import { ServiceDeskCalendar } from './service-desk-calendar.js';

type Case = { name: string; from: string; hours: number; expected: string };

const cases: Case[] = [
  {
    name: 'soma dentro do expediente',
    from: '2026-10-21T10:00:00-03:00',
    hours: 2,
    expected: '2026-10-21T12:00:00-03:00',
  },
  {
    name: 'atravessa o fim do expediente na sexta e o fim de semana',
    from: '2026-10-23T16:00:00-03:00',
    hours: 4,
    expected: '2026-10-26T10:00:00-03:00',
  },
  {
    name: 'termina exatamente às 18h',
    from: '2026-10-21T16:00:00-03:00',
    hours: 2,
    expected: '2026-10-21T18:00:00-03:00',
  },
  {
    name: 'começa no próximo expediente quando aberto à noite',
    from: '2026-10-21T21:30:00-03:00',
    hours: 1,
    expected: '2026-10-22T09:00:00-03:00',
  },
  {
    name: 'começa às 8h quando aberto de madrugada',
    from: '2026-10-21T05:00:00-03:00',
    hours: 1,
    expected: '2026-10-21T09:00:00-03:00',
  },
  {
    name: 'começa na segunda quando aberto no sábado',
    from: '2026-10-24T11:00:00-03:00',
    hours: 3,
    expected: '2026-10-26T11:00:00-03:00',
  },
  {
    name: 'começa na segunda quando aberto no domingo',
    from: '2026-10-25T20:00:00-03:00',
    hours: 1,
    expected: '2026-10-26T09:00:00-03:00',
  },
  {
    name: 'conta 3 dias úteis como 30 horas úteis a partir do mesmo horário',
    from: '2026-10-20T10:20:00-03:00',
    hours: 30,
    expected: '2026-10-23T10:20:00-03:00',
  },
  {
    name: 'conta 5 dias úteis atravessando o fim de semana',
    from: '2026-10-22T09:00:00-03:00',
    hours: 50,
    expected: '2026-10-29T09:00:00-03:00',
  },
];

describe('ServiceDeskCalendar', () => {
  const calendar = new ServiceDeskCalendar();

  it.each(cases)('$name', ({ from, hours, expected }: Case) => {
    const result = calendar.addBusinessHours(new Date(from), hours);
    expect(result.toISOString()).toBe(new Date(expected).toISOString());
  });
});
