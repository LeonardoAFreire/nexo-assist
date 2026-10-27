import { TicketNotFoundError } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeService } from './testing/make-service.js';
import {
  ANA,
  BRUNO,
  makeDraft,
  makeResolvedRecord,
  makeTicketRecord,
} from './testing/ticket-factories.js';

function seededService() {
  const context = makeService();
  context.repository.seed([
    makeTicketRecord({ number: 'INC-20400' }),
    makeResolvedRecord(2, {
      number: 'INC-20150',
      category: 'access',
      title: 'Acesso ao ERP',
      description: 'Sem acesso',
    }),
    makeTicketRecord({ number: 'INC-20517', requesterId: BRUNO, title: 'Rede caiu' }),
    makeResolvedRecord(2, { number: 'INC-20402', requesterId: BRUNO }),
  ]);
  return context;
}

describe('TicketsService: privacidade', () => {
  it('TU-privacidade: lista só os chamados do solicitante', async () => {
    const { service } = seededService();
    const own = await service.listOwn({ requesterId: ANA, scope: 'all' });
    expect(own.map((ticket) => ticket.number).sort()).toEqual(['INC-20150', 'INC-20400']);
  });

  it('filtra por escopo aberto e fechado', async () => {
    const { service } = seededService();
    const open = await service.listOwn({ requesterId: ANA, scope: 'open' });
    const closed = await service.listOwn({ requesterId: ANA, scope: 'closed' });
    expect(open.map((ticket) => ticket.number)).toEqual(['INC-20400']);
    expect(closed.map((ticket) => ticket.number)).toEqual(['INC-20150']);
  });

  it('consulta de chamado alheio devolve null, igual ao inexistente', async () => {
    const { service } = seededService();
    const foreign = await service.findOwn({ requesterId: ANA, number: 'INC-20517' });
    const missing = await service.findOwn({ requesterId: ANA, number: 'INC-99999' });
    expect(foreign).toBeNull();
    expect(missing).toEqual(foreign);
  });

  it('busca não devolve chamado de outro solicitante', async () => {
    const { service } = seededService();
    expect(await service.searchOwn({ requesterId: ANA, query: 'rede caiu' })).toEqual([]);
    const found = await service.searchOwn({ requesterId: ANA, query: 'vpn' });
    expect(found.map((ticket) => ticket.number)).toEqual(['INC-20400']);
  });

  it('busca por número e ignora acentos', async () => {
    const { service } = seededService();
    expect(await service.searchOwn({ requesterId: ANA, query: 'inc-20150' })).toHaveLength(1);
    expect(await service.searchOwn({ requesterId: ANA, query: 'nao conecta' })).toHaveLength(1);
    expect(await service.searchOwn({ requesterId: ANA, query: '  ' })).toEqual([]);
  });

  it('findDuplicates ignora chamados de outro solicitante', async () => {
    const { service } = seededService();
    const result = await service.findDuplicates({
      requesterId: BRUNO,
      category: 'access',
      text: 'Acesso ao ERP',
    });
    expect(result.reopenable).toEqual([]);
    expect(result.openMatches).toEqual([]);
    const anaResult = await service.findDuplicates({
      requesterId: ANA,
      category: 'access',
      text: 'Acesso ao ERP',
    });
    expect(anaResult.reopenable.map((ticket) => ticket.number)).toEqual(['INC-20150']);
  });

  it('complementar chamado alheio lança o mesmo erro de chamado inexistente', async () => {
    const { service, repository } = seededService();
    const before = await repository.findByNumber({ requesterId: BRUNO, number: 'INC-20517' });
    const attempt = (number: string) =>
      service.complement({ requesterId: ANA, number, text: 'oi', idempotencyKey: `k-${number}` });
    await expect(attempt('INC-20517')).rejects.toBeInstanceOf(TicketNotFoundError);
    const foreignError = await attempt('INC-20517').catch((error: unknown) => error);
    const missingError = await attempt('INC-99999').catch((error: unknown) => error);
    expect(missingError).toEqual(foreignError);
    expect(await repository.findByNumber({ requesterId: BRUNO, number: 'INC-20517' })).toEqual(
      before,
    );
  });

  it('reabrir chamado alheio lança o mesmo erro de chamado inexistente', async () => {
    const { service } = seededService();
    const attempt = (number: string) =>
      service.reopen({ requesterId: ANA, number, reason: 'voltou', idempotencyKey: `r-${number}` });
    await expect(attempt('INC-20402')).rejects.toBeInstanceOf(TicketNotFoundError);
    await expect(attempt('INC-99999')).rejects.toBeInstanceOf(TicketNotFoundError);
  });
});

describe('TicketsService: cálculos', () => {
  it('calcula dueAt e overdue a partir da última atualização', async () => {
    const { service, repository } = makeService();
    repository.seed([
      makeTicketRecord({ number: 'INC-20311', lastUpdatedAt: '2026-10-14T13:20:00.000Z' }),
      makeResolvedRecord(4, { number: 'INC-20150' }),
    ]);
    const stale = await service.findOwn({ requesterId: ANA, number: 'INC-20311' });
    const resolved = await service.findOwn({ requesterId: ANA, number: 'INC-20150' });
    expect(stale).toMatchObject({ overdue: true });
    expect(stale?.dueAt).not.toBeNull();
    expect(resolved).toMatchObject({ overdue: false, dueAt: null });
  });

  it('não expõe o requesterId nas respostas', async () => {
    const { service } = seededService();
    const detail = await service.findOwn({ requesterId: ANA, number: 'INC-20400' });
    expect(detail).not.toHaveProperty('requesterId');
  });

  it('delega priorização e prazo de contato às regras', async () => {
    const { service } = makeService();
    const assessment = await service.assessPriority(makeDraft().priorityFacts);
    expect(assessment.priority).toBe('medium');
    const critical = await service.contactDeadline({
      from: '2026-10-26T12:00:00.000Z',
      critical: true,
    });
    expect(critical).toBe('2026-10-26T13:00:00.000Z');
    const regular = await service.contactDeadline({
      from: '2026-10-26T12:00:00.000Z',
      critical: false,
    });
    expect(regular).toBe('2026-10-26T14:00:00.000Z');
  });
});
