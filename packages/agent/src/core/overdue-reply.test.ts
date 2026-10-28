import { describe, expect, it } from 'vitest';
import { makeTicket } from '../persistence/scripted/make-ticket.js';
import { overdueSentence } from './overdue-reply.js';

const NOW = new Date('2026-10-27T15:00:00.000Z');

describe('overdueSentence', () => {
  it('diz há quantos dias o chamado está sem atualização e a prioridade cujo prazo passou', () => {
    const ticket = makeTicket({
      number: 'INC-20311',
      priority: 'medium',
      overdue: true,
      lastUpdatedAt: '2026-10-21T14:00:00.000Z',
    });
    expect(overdueSentence(ticket, NOW)).toBe(
      'O INC-20311 está sem atualização há 6 dias e já passou do prazo da prioridade média.',
    );
  });

  it('usa o singular para um dia', () => {
    const ticket = makeTicket({ priority: 'high', lastUpdatedAt: '2026-10-26T12:00:00.000Z' });
    expect(overdueSentence(ticket, NOW)).toContain('há 1 dia e');
  });

  it('não fala em dias quando a última atualização foi hoje', () => {
    const ticket = makeTicket({
      number: 'INC-1',
      priority: 'high',
      lastUpdatedAt: NOW.toISOString(),
    });
    expect(overdueSentence(ticket, NOW)).toBe('O INC-1 já passou do prazo da prioridade alta.');
  });
});
