import { describe, expect, it } from 'vitest';
import { DuplicateFinder, type DuplicateSearch } from './duplicate-finder.js';
import { ReopenPolicy } from './reopen-policy.js';
import type { TicketRecord } from './ticket-record.js';

const NOW = new Date('2026-10-26T12:00:00Z');

function makeTicket(overrides: Partial<TicketRecord> = {}): TicketRecord {
  return {
    number: 'INC-20400',
    type: 'incident',
    title: 'VPN não conecta',
    description: 'Erro 809 ao conectar na VPN de casa',
    category: 'network_vpn',
    priority: 'high',
    status: 'open',
    openedAt: '2026-10-25T12:00:00.000Z',
    lastUpdatedAt: '2026-10-25T12:00:00.000Z',
    resolvedAt: null,
    dueAt: '2026-10-26T15:00:00.000Z',
    overdue: false,
    latestEvent: null,
    affected: 'only_me',
    requesterId: 'ana',
    ...overrides,
  };
}

function makeSearch(tickets: TicketRecord[], overrides: Partial<DuplicateSearch> = {}) {
  return {
    requesterId: 'ana',
    category: 'network_vpn',
    text: 'A VPN continua sem conectar',
    tickets,
    now: NOW,
    ...overrides,
  } satisfies DuplicateSearch;
}

function resolvedDaysAgo(days: number, overrides: Partial<TicketRecord> = {}): TicketRecord {
  const resolvedAt = new Date(NOW.getTime() - days * 86_400_000).toISOString();
  return makeTicket({ status: 'resolved', resolvedAt, dueAt: null, ...overrides });
}

describe('DuplicateFinder', () => {
  const finder = new DuplicateFinder(new ReopenPolicy());

  it('TU-08: considera duplicado um chamado aberto do mesmo solicitante sobre o mesmo problema', () => {
    const result = finder.find(makeSearch([makeTicket()]));
    expect(result.openMatches.map((ticket) => ticket.number)).toEqual(['INC-20400']);
    expect(result.rule).toContain('atualizar em vez de criar');
  });

  it('TU-08: nunca devolve chamado de outro solicitante', () => {
    const others = [
      makeTicket({ requesterId: 'bruno' }),
      resolvedDaysAgo(2, { requesterId: 'bruno' }),
    ];
    const result = finder.find(makeSearch(others));
    expect(result).toMatchObject({ openMatches: [], reopenable: [], expiredResolved: [] });
  });

  it('encontra por texto semelhante, sem acento nem diferença de maiúsculas, em outra categoria', () => {
    const ticket = makeTicket({ category: 'other', title: 'CONEXÃO da VPN falhando' });
    const search = makeSearch([ticket], { category: 'software', text: 'vpn conexao caiu' });
    expect(finder.find(search).openMatches).toHaveLength(1);
  });

  it('ignora chamado de outra categoria e de texto diferente', () => {
    const ticket = makeTicket({
      category: 'email',
      title: 'Caixa de e-mail cheia',
      description: 'Sem espaço',
    });
    expect(finder.find(makeSearch([ticket])).openMatches).toEqual([]);
  });

  it('indica reabertura para resolvido há até 7 dias', () => {
    const result = finder.find(makeSearch([resolvedDaysAgo(4)]));
    expect(result.reopenable).toHaveLength(1);
    expect(result.rule).toBe('chamado resolvido há 4 dias: pode ser reaberto');
  });

  it('usa o singular para um dia', () => {
    const result = finder.find(makeSearch([resolvedDaysAgo(1)]));
    expect(result.rule).toBe('chamado resolvido há 1 dia: pode ser reaberto');
  });

  it('separa resolvido há mais de 7 dias para citar no novo chamado', () => {
    const result = finder.find(makeSearch([resolvedDaysAgo(8)]));
    expect(result.reopenable).toEqual([]);
    expect(result.expiredResolved).toHaveLength(1);
    expect(result.rule).toContain('citando o anterior');
  });

  it('prefere atualizar o chamado aberto quando também há resolvido reabrível', () => {
    const result = finder.find(
      makeSearch([makeTicket(), resolvedDaysAgo(2, { number: 'INC-20100' })]),
    );
    expect(result.rule).toContain('atualizar em vez de criar');
    expect(result.reopenable).toHaveLength(1);
  });

  it('informa que pode abrir um novo quando nada é semelhante', () => {
    expect(finder.find(makeSearch([])).rule).toBe(
      'nenhum chamado semelhante: pode abrir um novo chamado',
    );
  });

  it('não expõe descrição nem solicitante nos resumos', () => {
    const [summary] = finder.find(makeSearch([makeTicket()])).openMatches;
    expect(summary).not.toHaveProperty('description');
    expect(summary).not.toHaveProperty('requesterId');
  });
});
