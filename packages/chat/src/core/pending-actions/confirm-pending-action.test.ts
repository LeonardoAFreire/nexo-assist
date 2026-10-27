import {
  TicketNotFoundError,
  TicketRuleViolationError,
  TicketsUnavailableError,
} from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { CONVERSATION_ID, EMPLOYEE_ID, makeDraft } from '../testing/factories.js';
import { makeFixture } from '../testing/pending-action-fixture.js';
import { ConfirmPendingAction } from './confirm-pending-action.js';

const FAST_POLICY = { attempts: 3, timeoutMs: 1000, baseDelayMs: 1, backoffFactor: 1 };

async function setup() {
  const fixture = makeFixture();
  const record = await fixture.pendingActions.propose({
    conversationId: CONVERSATION_ID,
    proposal: { kind: 'create_ticket', draft: makeDraft(), targetNumber: null, complement: null },
  });
  const confirm = new ConfirmPendingAction({
    actions: fixture.actions,
    messages: fixture.messages,
    tickets: fixture.tickets,
    clock: fixture.clock,
    policy: FAST_POLICY,
  });
  return { ...fixture, record, confirm };
}

describe('ConfirmPendingAction', () => {
  it('cria o chamado com o dono da conversa e idempotencyKey igual ao id da ação', async () => {
    const { confirm, conversation, record, tickets, actions } = await setup();
    const result = await confirm.execute({ conversation, actionId: record.id, via: 'button' });
    expect(tickets.writes).toEqual([
      expect.objectContaining({
        kind: 'create',
        requesterId: EMPLOYEE_ID,
        idempotencyKey: record.id,
      }),
    ]);
    expect(result.action).toMatchObject({ status: 'confirmed', confirmedVia: 'button' });
    expect(result.action.resultTicket?.number).toBe('INC-20519');
    expect(await actions.findById(record.id)).toEqual(result.action);
  });

  it('grava a mensagem do agent com o cartão do chamado e o passo executado', async () => {
    const { confirm, conversation, record, messages } = await setup();
    const { message } = await confirm.execute({ conversation, actionId: record.id, via: 'text' });
    expect(message.parts).toEqual([expect.objectContaining({ type: 'ticket_card' })]);
    expect(message.turn?.steps[0]).toMatchObject({ kind: 'executed_action', attempts: 1 });
    expect(await messages.findById(message.id)).toEqual(message);
  });

  it.each(['cancelled', 'superseded'] as const)('recusa confirmar ação %s', async (status) => {
    const { confirm, conversation, record, actions, tickets } = await setup();
    await actions.save({ ...record, status });
    await expect(
      confirm.execute({ conversation, actionId: record.id, via: 'button' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'pending_action_not_pending' }));
    expect(tickets.writes).toHaveLength(0);
  });

  it('não confirma duas vezes a mesma ação', async () => {
    const { confirm, conversation, record, tickets } = await setup();
    await confirm.execute({ conversation, actionId: record.id, via: 'button' });
    await expect(
      confirm.execute({ conversation, actionId: record.id, via: 'shortcut' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'pending_action_not_pending' }));
    expect(tickets.writes).toHaveLength(1);
  });

  it('tenta de novo no legado e registra o número de tentativas', async () => {
    const { confirm, conversation, record, tickets } = await setup();
    tickets.failures.push(new TicketsUnavailableError(), new TicketsUnavailableError());
    const { message } = await confirm.execute({ conversation, actionId: record.id, via: 'button' });
    expect(message.turn?.steps[0]?.attempts).toBe(3);
    expect(tickets.writes).toHaveLength(1);
  });

  it('mantém a ação pending quando o legado segue indisponível após as tentativas', async () => {
    const { confirm, conversation, record, tickets, actions } = await setup();
    tickets.failures.push(...Array.from({ length: 3 }, () => new TicketsUnavailableError()));
    await expect(
      confirm.execute({ conversation, actionId: record.id, via: 'button' }),
    ).rejects.toBeInstanceOf(TicketsUnavailableError);
    expect((await actions.findById(record.id))?.status).toBe('pending');
    const retried = await confirm.execute({ conversation, actionId: record.id, via: 'button' });
    expect(retried.action.status).toBe('confirmed');
  });

  it.each([new TicketRuleViolationError('fora da janela'), new TicketNotFoundError()])(
    'marca a ação como failed quando o tickets recusa em definitivo (%s)',
    async (error) => {
      const { confirm, conversation, record, tickets, actions } = await setup();
      tickets.failures.push(error, new TicketsUnavailableError());
      await expect(
        confirm.execute({ conversation, actionId: record.id, via: 'button' }),
      ).rejects.toBe(error);
      expect((await actions.findById(record.id))?.status).toBe('failed');
      expect(tickets.failures).toHaveLength(1);
    },
  );

  it('confirma complemento e reabertura chamando a operação correta', async () => {
    const { confirm, conversation, pendingActions, tickets } = await setup();
    const complement = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: {
        kind: 'complement_ticket',
        draft: null,
        targetNumber: 'INC-20311',
        complement: 'Mais info',
      },
    });
    await confirm.execute({ conversation, actionId: complement.id, via: 'text' });
    const reopen = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: {
        kind: 'reopen_ticket',
        draft: null,
        targetNumber: 'INC-20150',
        complement: 'Voltou',
      },
    });
    const { message } = await confirm.execute({
      conversation,
      actionId: reopen.id,
      via: 'shortcut',
    });
    expect(tickets.writes.map((write) => write.kind)).toEqual(['complement', 'reopen']);
    expect(message.text).toContain('INC-20150');
  });

  it('não confirma ação de outra conversa', async () => {
    const { confirm, conversation, pendingActions, tickets } = await setup();
    const foreign = await pendingActions.propose({
      conversationId: 'outra-conversa',
      proposal: { kind: 'create_ticket', draft: makeDraft(), targetNumber: null, complement: null },
    });
    await expect(
      confirm.execute({ conversation, actionId: foreign.id, via: 'button' }),
    ).rejects.toThrow(expect.objectContaining({ code: 'not_found' }));
    expect(tickets.writes).toHaveLength(0);
  });
});
