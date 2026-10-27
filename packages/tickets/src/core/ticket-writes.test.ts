import { TicketRuleViolationError } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeService } from './testing/make-service.js';
import {
  ANA,
  makeDraft,
  makeResolvedRecord,
  makeTicketRecord,
} from './testing/ticket-factories.js';

const ONE_HOUR_MILLISECONDS = 3_600_000;

describe('CreateTicket', () => {
  it('numera incidentes a partir de INC-20520 e requisições a partir de REQ-10450', async () => {
    const { service } = makeService();
    const first = await service.create({
      requesterId: ANA,
      draft: makeDraft(),
      idempotencyKey: 'a',
    });
    const second = await service.create({
      requesterId: ANA,
      draft: makeDraft(),
      idempotencyKey: 'b',
    });
    const request = await service.create({
      requesterId: ANA,
      draft: makeDraft({ type: 'request' }),
      idempotencyKey: 'c',
    });
    expect([first.number, second.number, request.number]).toEqual([
      'INC-20520',
      'INC-20521',
      'REQ-10450',
    ]);
  });

  it('TU-idempotência: a mesma idempotencyKey devolve o mesmo chamado sem duplicar', async () => {
    const { service, repository } = makeService();
    const input = { requesterId: ANA, draft: makeDraft(), idempotencyKey: 'acao-1' };
    const first = await service.create(input);
    const second = await service.create(input);
    expect(second.number).toBe(first.number);
    expect(await repository.listByRequester(ANA)).toHaveLength(1);
  });

  it('abre o chamado com status aberto, datas do relógio e prioridade recalculada', async () => {
    const { service } = makeService();
    const ticket = await service.create({
      requesterId: ANA,
      draft: makeDraft({ priority: 'critical' }),
      idempotencyKey: 'x',
    });
    expect(ticket).toMatchObject({
      status: 'open',
      priority: 'medium',
      openedAt: '2026-10-26T12:00:00.000Z',
      lastUpdatedAt: '2026-10-26T12:00:00.000Z',
      resolvedAt: null,
      overdue: false,
      latestEvent: { kind: 'created', label: 'Chamado aberto' },
    });
    expect(ticket.dueAt).not.toBeNull();
  });
});

describe('ComplementTicket', () => {
  it('TU-complemento: recusa chamado resolvido', async () => {
    const { service, repository } = makeService();
    repository.seed([makeResolvedRecord(1)]);
    await expect(
      service.complement({
        requesterId: ANA,
        number: 'INC-20400',
        text: 'mais',
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(TicketRuleViolationError);
  });

  it('recusa complemento vazio', async () => {
    const { service, repository } = makeService();
    repository.seed([makeTicketRecord()]);
    await expect(
      service.complement({
        requesterId: ANA,
        number: 'INC-20400',
        text: '   ',
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(TicketRuleViolationError);
  });

  it('reinicia o prazo, registra o evento e é idempotente', async () => {
    const { service, repository, clock } = makeService();
    repository.seed([makeTicketRecord({ dueAt: null })]);
    clock.advanceMilliseconds(ONE_HOUR_MILLISECONDS);
    const input = {
      requesterId: ANA,
      number: 'INC-20400',
      text: ' Ainda falha ',
      idempotencyKey: 'k',
    };
    const first = await service.complement(input);
    const second = await service.complement(input);
    expect(first.lastUpdatedAt).toBe('2026-10-26T13:00:00.000Z');
    expect(first.description).toContain('Ainda falha');
    expect(first.latestEvent).toMatchObject({ kind: 'complemented' });
    expect(second).toEqual(first);
    expect(repository.events).toHaveLength(1);
  });
});

describe('ReopenTicket', () => {
  it('TU-reabertura: recusa fora da janela de 7 dias', async () => {
    const { service, repository } = makeService();
    repository.seed([makeResolvedRecord(8)]);
    await expect(
      service.reopen({
        requesterId: ANA,
        number: 'INC-20400',
        reason: 'voltou',
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(TicketRuleViolationError);
  });

  it('recusa reabrir chamado que não está resolvido', async () => {
    const { service, repository } = makeService();
    repository.seed([makeTicketRecord()]);
    await expect(
      service.reopen({
        requesterId: ANA,
        number: 'INC-20400',
        reason: 'voltou',
        idempotencyKey: 'k',
      }),
    ).rejects.toBeInstanceOf(TicketRuleViolationError);
  });

  it('reabre dentro da janela, limpa a resolução e é idempotente', async () => {
    const { service, repository } = makeService();
    repository.seed([makeResolvedRecord(4)]);
    const input = { requesterId: ANA, number: 'INC-20400', reason: 'voltou', idempotencyKey: 'k' };
    const reopened = await service.reopen(input);
    const again = await service.reopen(input);
    expect(reopened).toMatchObject({ status: 'open', resolvedAt: null });
    expect(reopened.latestEvent).toMatchObject({ kind: 'reopened', label: 'Chamado reaberto' });
    expect(again).toEqual(reopened);
    expect(repository.events).toHaveLength(1);
  });
});

describe('RecordHandoff', () => {
  const handoff = {
    conversationId: '6f1c0000-0000-4000-8000-000000000001',
    requesterId: ANA,
    reason: 'overdue' as const,
    level: 'N2' as const,
    ticketNumbers: ['INC-20400', 'INC-20517'],
  };

  it('registra a transferência só nos chamados do solicitante, uma vez', async () => {
    const { service, repository } = makeService();
    repository.seed([
      makeTicketRecord(),
      makeTicketRecord({ number: 'INC-20517', requesterId: 'bruno' }),
    ]);
    await service.recordHandoff(handoff);
    await service.recordHandoff(handoff);
    expect(repository.events.map((event) => event.number)).toEqual(['INC-20400']);
    const ticket = await service.findOwn({ requesterId: ANA, number: 'INC-20400' });
    expect(ticket?.latestEvent).toMatchObject({ kind: 'handed_off' });
  });
});
