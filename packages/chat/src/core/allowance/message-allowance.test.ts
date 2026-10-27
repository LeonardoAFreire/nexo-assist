import { describe, expect, it } from 'vitest';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { InMemorySessionUsageRepository } from './in-memory-session-usage-repository.js';
import { MessageAllowance, SESSION_MESSAGE_LIMIT } from './message-allowance.js';

const USER_ID = 'user-1';

function makeAllowance(): MessageAllowance {
  return new MessageAllowance(new InMemorySessionUsageRepository());
}

async function consumeMany(allowance: MessageAllowance, sessionId: string, times: number) {
  let last = await allowance.current(sessionId);
  for (let index = 0; index < times; index += 1) {
    last = await allowance.consume({ sessionId, userId: USER_ID });
  }
  return last;
}

describe('MessageAllowance', () => {
  it('aceita a 30ª mensagem da sessão com remaining zerado', async () => {
    const allowance = makeAllowance();
    const result = await consumeMany(allowance, 'sessao-a', SESSION_MESSAGE_LIMIT);
    expect(result).toEqual({ messagesUsed: 30, messagesLimit: 30, remaining: 0 });
  });

  it('recusa a 31ª mensagem com message_limit_reached sem aumentar o contador', async () => {
    const allowance = makeAllowance();
    await consumeMany(allowance, 'sessao-a', SESSION_MESSAGE_LIMIT);
    await expect(allowance.consume({ sessionId: 'sessao-a', userId: USER_ID })).rejects.toThrow(
      expect.objectContaining({ code: 'message_limit_reached' }),
    );
    await expect(
      allowance.consume({ sessionId: 'sessao-a', userId: USER_ID }),
    ).rejects.toBeInstanceOf(ChatRuleError);
    expect((await allowance.current('sessao-a')).messagesUsed).toBe(30);
  });

  it('começa do zero em outra sessão do mesmo usuário', async () => {
    const allowance = makeAllowance();
    await consumeMany(allowance, 'sessao-a', SESSION_MESSAGE_LIMIT);
    const first = await allowance.consume({ sessionId: 'sessao-b', userId: USER_ID });
    expect(first).toEqual({ messagesUsed: 1, messagesLimit: 30, remaining: 29 });
  });

  it('informa o uso atual sem consumir', async () => {
    const allowance = makeAllowance();
    await consumeMany(allowance, 'sessao-a', 18);
    expect(await allowance.current('sessao-a')).toEqual({
      messagesUsed: 18,
      messagesLimit: 30,
      remaining: 12,
    });
  });
});
