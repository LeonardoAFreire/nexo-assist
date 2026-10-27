import type { HandoffInfo } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { CONVERSATION_ID, EMPLOYEE_ID, NOW_ISO } from '../testing/factories.js';
import { Conversation } from './conversation.js';
import { InMemoryConversationRepository } from './in-memory-conversation-repository.js';

const ANALYST_ID = 'a1b2c3d4-0000-4000-8000-000000000001';

function makeHandoff(): HandoffInfo {
  return {
    reason: 'requested',
    level: 'N1',
    summary: 'Ana pediu um analista.',
    ticketNumbers: [],
    confidence: null,
    contactDueAt: '2026-10-26T15:05:00.000Z',
    handedOffAt: NOW_ISO,
  };
}

function openConversation(): Conversation {
  return Conversation.open({ id: CONVERSATION_ID, employeeId: EMPLOYEE_ID, now: NOW_ISO });
}

function expectInvalidState(action: () => unknown): void {
  expect(action).toThrow(ChatRuleError);
  expect(action).toThrow(expect.objectContaining({ code: 'invalid_conversation_state' }));
}

describe('Conversation', () => {
  it('abre no estado agent, sem analista nem transferência', () => {
    const conversation = openConversation();
    expect(conversation.state).toBe('agent');
    expect(conversation.props.handoff).toBeNull();
    expect(conversation.props.assignedAnalystId).toBeNull();
  });

  it('percorre agent, waiting_analyst, with_analyst e volta ao agent', () => {
    const waiting = openConversation().handOff(makeHandoff());
    expect(waiting.state).toBe('waiting_analyst');
    expect(waiting.props.handoff?.level).toBe('N1');
    const withAnalyst = waiting.claim(ANALYST_ID);
    expect(withAnalyst.state).toBe('with_analyst');
    expect(withAnalyst.props.assignedAnalystId).toBe(ANALYST_ID);
    const released = withAnalyst.release();
    expect(released.state).toBe('agent');
    expect(released.props.assignedAnalystId).toBeNull();
  });

  it('encerra pelo analista com resolution analyst', () => {
    const closed = openConversation()
      .handOff(makeHandoff())
      .claim(ANALYST_ID)
      .closeByAnalyst(NOW_ISO);
    expect(closed.state).toBe('closed');
    expect(closed.props.resolution).toBe('analyst');
    expect(closed.props.closedAt).toBe(NOW_ISO);
  });

  it('encerra pelo agent com resolution agent', () => {
    const closed = openConversation().closeByAgent(NOW_ISO);
    expect(closed.props.resolution).toBe('agent');
  });

  it('não altera a conversa original ao transitar', () => {
    const original = openConversation();
    original.handOff(makeHandoff());
    expect(original.state).toBe('agent');
  });

  it('recusa transferir uma conversa já transferida', () => {
    const waiting = openConversation().handOff(makeHandoff());
    expectInvalidState(() => waiting.handOff(makeHandoff()));
  });

  it('recusa assumir conversa que está com o agent', () => {
    expectInvalidState(() => openConversation().claim(ANALYST_ID));
  });

  it('recusa devolver ou encerrar pelo analista conversa que não está com analista', () => {
    const waiting = openConversation().handOff(makeHandoff());
    expectInvalidState(() => waiting.release());
    expectInvalidState(() => waiting.closeByAnalyst(NOW_ISO));
  });

  it('não sai do estado closed', () => {
    const closed = openConversation().closeByAgent(NOW_ISO);
    expectInvalidState(() => closed.handOff(makeHandoff()));
    expectInvalidState(() => closed.release());
  });
});

describe('InMemoryConversationRepository', () => {
  it('encontra a conversa ativa do funcionário e ignora as encerradas', async () => {
    const repository = new InMemoryConversationRepository();
    await repository.save(openConversation().closeByAgent(NOW_ISO));
    expect(await repository.findActiveByEmployee(EMPLOYEE_ID)).toBeNull();
    await repository.save(
      Conversation.open({ id: 'outra', employeeId: EMPLOYEE_ID, now: NOW_ISO }),
    );
    expect((await repository.findActiveByEmployee(EMPLOYEE_ID))?.id).toBe('outra');
    expect((await repository.findById(CONVERSATION_ID))?.state).toBe('closed');
    expect(await repository.findById('inexistente')).toBeNull();
  });
});
