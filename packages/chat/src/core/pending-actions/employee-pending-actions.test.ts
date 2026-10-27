import { TicketsUnavailableError } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeChatFixture } from '../testing/chat-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { makeDraft } from '../testing/factories.js';
import { ANA, BRUNO } from '../testing/people.js';
import { ConfirmPendingAction } from './confirm-pending-action.js';
import { EditPendingAction } from './edit-pending-action.js';
import { EmployeePendingActions } from './employee-pending-actions.js';
import { PendingActions } from './pending-actions.js';

const FAST_POLICY = { attempts: 2, timeoutMs: 1000, baseDelayMs: 1, backoffFactor: 1 };

async function setup() {
  const fixture = makeChatFixture();
  const { conversations, messages, actions, tickets, clock } = fixture;
  const conversation = await seedConversation(fixture, { state: 'agent' });
  const pendingActions = new PendingActions(actions, tickets, clock);
  const record = await pendingActions.propose({
    conversationId: conversation.id,
    proposal: { kind: 'create_ticket', draft: makeDraft(), targetNumber: null, complement: null },
  });
  const employeeActions = new EmployeePendingActions({
    conversations,
    messages,
    edit: new EditPendingAction(actions, tickets),
    confirm: new ConfirmPendingAction({ actions, messages, tickets, clock, policy: FAST_POLICY }),
    pendingActions,
    notifier: fixture.notifier,
    views: fixture.views,
    clock,
  });
  return { ...fixture, conversation, record, employeeActions };
}

describe('EmployeePendingActions', () => {
  it('confirma e devolve a mensagem com a visão da conversa já sem ação pendente', async () => {
    const { employeeActions, record, tickets, conversations, conversation } = await setup();
    const outcome = await employeeActions.confirm({
      employeeId: ANA.id,
      actionId: record.id,
      via: 'button',
    });
    expect(outcome.message.parts[0]).toMatchObject({ type: 'ticket_card' });
    expect(outcome.conversation.pendingAction).toBeNull();
    expect(tickets.writes).toHaveLength(1);
    const saved = await conversations.findById(conversation.id);
    expect(saved?.props.lastMessageAt).toBe(outcome.message.createdAt);
  });

  it('cancela com mensagem de sistema, avisa os assinantes e não chama o tickets', async () => {
    const { employeeActions, record, tickets, messages, hub, conversation } = await setup();
    const published: string[] = [];
    hub.forEmployee(ANA.id).subscribe((payload) => published.push(payload.event));
    const cancelled = await employeeActions.cancel({ employeeId: ANA.id, actionId: record.id });
    const [last] = await messages.listRecent({ conversationId: conversation.id, limit: 1 });
    expect(cancelled.status).toBe('cancelled');
    expect(last).toMatchObject({ author: 'system', text: 'Você cancelou a abertura do chamado.' });
    expect(published).toEqual(['message.created', 'conversation.updated']);
    expect(tickets.writes).toHaveLength(0);
  });

  it('edita o rascunho recalculando a prioridade', async () => {
    const { employeeActions, record } = await setup();
    const edited = await employeeActions.edit({
      employeeId: ANA.id,
      actionId: record.id,
      changes: { affected: 'my_team' },
    });
    expect(edited.draft?.affected).toBe('my_team');
    expect(edited.status).toBe('pending');
  });

  it('converte falha inesperada do tickets em tickets_unavailable e mantém a ação pending', async () => {
    const { employeeActions, record, tickets, actions } = await setup();
    tickets.failures.push(new Error('conexão recusada'), new Error('conexão recusada'));
    const attempt = employeeActions.confirm({
      employeeId: ANA.id,
      actionId: record.id,
      via: 'button',
    });
    await expect(attempt).rejects.toBeInstanceOf(TicketsUnavailableError);
    expect((await actions.findById(record.id))?.status).toBe('pending');
  });

  it('trata ação de outro funcionário ou sem conversa ativa como não encontrada', async () => {
    const { employeeActions, record } = await setup();
    const foreign = { employeeId: BRUNO.id, actionId: record.id };
    await expect(employeeActions.cancel(foreign)).rejects.toMatchObject({ code: 'not_found' });
    await expect(employeeActions.confirm({ ...foreign, via: 'button' })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});
