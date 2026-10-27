import { describe, expect, it } from 'vitest';
import { makeTurnFixture } from '../testing/turn-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { CONVERSATION_ID, EMPLOYEE_ID, makeDraft } from '../testing/factories.js';
import { toPendingAction } from '../pending-actions/to-pending-action.js';
import { GetEmployeeConversation } from './get-employee-conversation.js';

function makeUseCase(fixture: ReturnType<typeof makeTurnFixture>): GetEmployeeConversation {
  const { conversations, messages, views, timeline, clock, turnDeps } = fixture;
  return new GetEmployeeConversation({
    conversations,
    messages,
    allowance: turnDeps.allowance,
    views,
    timeline,
    clock,
  });
}

async function saveMessages(fixture: ReturnType<typeof makeTurnFixture>, total: number) {
  for (let index = 0; index < total; index += 1) {
    await fixture.messages.save({
      id: `m${index}`,
      conversationId: CONVERSATION_ID,
      author: 'employee',
      authorName: null,
      authorLevel: null,
      text: `mensagem ${index}`,
      parts: [],
      turn: null,
      status: 'complete',
      createdAt: new Date(Date.UTC(2026, 9, 26, 12, 0, index)).toISOString(),
    });
  }
}

describe('GetEmployeeConversation', () => {
  it('devolve conversa nula, linha do tempo vazia e uso zerado para quem nunca conversou', async () => {
    const view = await makeUseCase(makeTurnFixture()).execute({
      employeeId: EMPLOYEE_ID,
      sessionId: 's1',
    });
    expect(view).toEqual({
      conversation: null,
      timeline: [],
      usage: { messagesUsed: 0, messagesLimit: 30 },
      turnInProgress: false,
    });
  });

  it('limita a linha do tempo às últimas 100 mensagens, em ordem', async () => {
    const fixture = makeTurnFixture();
    await seedConversation(fixture, { state: 'agent' });
    await saveMessages(fixture, 120);
    const view = await makeUseCase(fixture).execute({ employeeId: EMPLOYEE_ID, sessionId: 's1' });
    expect(view.timeline).toHaveLength(100);
    expect(view.timeline[0]?.text).toBe('mensagem 20');
    expect(view.timeline.at(-1)?.text).toBe('mensagem 119');
  });

  it('mantém as mensagens de conversa encerrada e mostra conversa nula depois dela', async () => {
    const fixture = makeTurnFixture();
    await seedConversation(fixture, { state: 'closed' });
    await saveMessages(fixture, 2);
    const view = await makeUseCase(fixture).execute({ employeeId: EMPLOYEE_ID, sessionId: 's1' });
    expect(view.conversation).toBeNull();
    expect(view.timeline).toHaveLength(2);
  });

  it('atualiza o estado da ação pendente mostrada nas mensagens antigas', async () => {
    const fixture = makeTurnFixture();
    const conversation = await seedConversation(fixture, { state: 'agent' });
    const record = await fixture.turnDeps.pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: { kind: 'create_ticket', draft: makeDraft(), targetNumber: null, complement: null },
    });
    const action = toPendingAction(record);
    await fixture.messages.save({
      id: 'agent-1',
      conversationId: CONVERSATION_ID,
      author: 'agent',
      authorName: null,
      authorLevel: null,
      text: 'Confira',
      parts: [{ type: 'pending_action', action }],
      turn: null,
      status: 'complete',
      createdAt: '2026-10-26T13:00:00.000Z',
    });
    await fixture.turnDeps.pendingActions.cancel({
      conversation,
      actionId: record.id,
    });
    const view = await makeUseCase(fixture).execute({ employeeId: EMPLOYEE_ID, sessionId: 's1' });
    expect(view.timeline[0]?.parts[0]).toMatchObject({ action: { status: 'cancelled' } });
  });

  it('indica turno em andamento enquanto a trava está válida', async () => {
    const fixture = makeTurnFixture();
    const conversation = await seedConversation(fixture, { state: 'agent' });
    await fixture.conversations.save(
      conversation.withChanges({ turnLockUntil: '2026-10-26T13:07:00.000Z' }),
    );
    const view = await makeUseCase(fixture).execute({ employeeId: EMPLOYEE_ID, sessionId: 's1' });
    expect(view.turnInProgress).toBe(true);
  });
});
