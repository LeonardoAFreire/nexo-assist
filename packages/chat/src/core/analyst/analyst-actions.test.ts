import { describe, expect, it } from 'vitest';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { makeChatFixture } from '../testing/chat-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { CONVERSATION_ID } from '../testing/factories.js';
import { GABRIELA, RAFAEL } from '../testing/people.js';
import { ClaimConversation } from './claim-conversation.js';
import { CloseConversation } from './close-conversation.js';
import { ReleaseConversation } from './release-conversation.js';
import { SendAnalystMessage } from './send-analyst-message.js';

async function expectRuleError(promise: Promise<unknown>, code: string, text?: string) {
  await expect(promise).rejects.toBeInstanceOf(ChatRuleError);
  await expect(promise).rejects.toMatchObject({ code });
  if (text !== undefined) {
    await expect(promise).rejects.toThrow(text);
  }
}

function setup() {
  const fixture = makeChatFixture();
  const claim = new ClaimConversation(fixture.analystDeps, fixture.identity);
  return { fixture, claim, input: { analyst: RAFAEL, conversationId: CONVERSATION_ID } };
}

describe('ClaimConversation', () => {
  it('assume a conversa aguardando atendente, pausa o agent e registra o evento', async () => {
    const { fixture, claim, input } = setup();
    await seedConversation(fixture, { state: 'waiting_analyst' });
    const claimed = await claim.execute(input);
    expect(claimed.state).toBe('with_analyst');
    expect(claimed.props.assignedAnalystId).toBe(RAFAEL.id);
    const [event] = await fixture.messages.listRecent({
      conversationId: CONVERSATION_ID,
      limit: 5,
    });
    expect(event?.author).toBe('system');
    expect(event?.text).toContain('Rafael Lima assumiu · agent pausado');
  });

  it('recusa assumir conversa já assumida por outro analista, citando quem assumiu (TU-13)', async () => {
    const { fixture, claim, input } = setup();
    await seedConversation(fixture, { state: 'waiting_analyst' });
    await claim.execute(input);
    await expectRuleError(
      claim.execute({ analyst: GABRIELA, conversationId: CONVERSATION_ID }),
      'conversation_already_claimed',
      'Esta conversa já está sendo atendida por Rafael Lima.',
    );
    const stored = await fixture.conversations.findById(CONVERSATION_ID);
    expect(stored?.props.assignedAnalystId).toBe(RAFAEL.id);
  });

  it('só um dos analistas vence quando dois assumem ao mesmo tempo', async () => {
    const { fixture, claim } = setup();
    await seedConversation(fixture, { state: 'waiting_analyst' });
    const attempts = [RAFAEL, GABRIELA].map((analyst) =>
      claim.execute({ analyst, conversationId: CONVERSATION_ID }),
    );
    const settled = await Promise.allSettled(attempts);
    expect(settled.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(settled.filter((result) => result.status === 'rejected')).toHaveLength(1);
  });

  it('recusa assumir conversa com o agent ou encerrada, e conversa inexistente', async () => {
    const { fixture, claim, input } = setup();
    await seedConversation(fixture, { state: 'agent' });
    await expectRuleError(claim.execute(input), 'invalid_conversation_state');
    await expectRuleError(claim.execute({ ...input, conversationId: 'inexistente' }), 'not_found');
  });
});

describe('ReleaseConversation e CloseConversation', () => {
  it('devolve ao agent a conversa assumida e registra o evento', async () => {
    const { fixture, input } = setup();
    await seedConversation(fixture, { state: 'with_analyst' });
    const released = await new ReleaseConversation(fixture.analystDeps).execute(input);
    expect(released.state).toBe('agent');
    expect(released.props.assignedAnalystId).toBeNull();
  });

  it('encerra a conversa assumida com resolution analyst', async () => {
    const { fixture, input } = setup();
    await seedConversation(fixture, { state: 'with_analyst' });
    const closed = await new CloseConversation(fixture.analystDeps).execute(input);
    expect(closed.props.resolution).toBe('analyst');
    expect(closed.state).toBe('closed');
  });

  it('recusa devolver ou encerrar quando não é o analista atribuído', async () => {
    const { fixture } = setup();
    await seedConversation(fixture, { state: 'with_analyst' });
    const other = { analyst: GABRIELA, conversationId: CONVERSATION_ID };
    await expectRuleError(
      new ReleaseConversation(fixture.analystDeps).execute(other),
      'conversation_not_claimed',
    );
    await expectRuleError(
      new CloseConversation(fixture.analystDeps).execute(other),
      'conversation_not_claimed',
    );
  });
});

describe('SendAnalystMessage', () => {
  it('grava a mensagem com o nome e o nível do analista que assumiu', async () => {
    const { fixture, input } = setup();
    await seedConversation(fixture, { state: 'with_analyst' });
    const message = await new SendAnalystMessage(fixture.analystDeps).execute({
      ...input,
      text: 'Olá, vou ajudar.',
    });
    expect(message).toMatchObject({
      author: 'analyst',
      authorName: 'Rafael Lima',
      authorLevel: 'N2',
    });
    expect(await fixture.messages.findById(message.id)).toEqual(message);
  });

  it('recusa responder sem ter assumido, sem assumir automaticamente', async () => {
    const { fixture, input } = setup();
    await seedConversation(fixture, { state: 'waiting_analyst' });
    await expectRuleError(
      new SendAnalystMessage(fixture.analystDeps).execute({ ...input, text: 'Oi' }),
      'conversation_not_claimed',
    );
    expect((await fixture.conversations.findById(CONVERSATION_ID))?.state).toBe('waiting_analyst');
  });
});
