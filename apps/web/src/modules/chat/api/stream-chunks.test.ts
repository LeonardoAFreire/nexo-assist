import type { ChatStreamEvent } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeChatMessage, makeConversation, makeStep } from '@/test/chat-factories';
import type { NexoChunk } from '../types/nexo-ui-message.js';
import { InterruptedTurnError, toChunks } from './stream-chunks.js';

const REPLY_ID = '7c1d0000-0000-4000-8000-0000000000aa';
const USAGE = { messagesUsed: 1, messagesLimit: 30 };

async function* fromList(events: ChatStreamEvent[]): AsyncGenerator<ChatStreamEvent> {
  yield* events;
}

async function collect(events: ChatStreamEvent[]): Promise<NexoChunk[]> {
  const chunks: NexoChunk[] = [];
  for await (const chunk of toChunks(fromList(events))) {
    chunks.push(chunk);
  }
  return chunks;
}

describe('toChunks', () => {
  it('abre a resposta com o id do servidor e fecha com os metadados da mensagem salva', async () => {
    const reply = makeChatMessage({ id: REPLY_ID, author: 'agent', text: 'Oi, Ana.' });
    const step = makeStep();
    const chunks = await collect([
      { event: 'turn.started', data: { replyId: REPLY_ID } },
      { event: 'turn.step', data: { step } },
      { event: 'turn.text-delta', data: { delta: 'Oi, ' } },
      { event: 'turn.text-delta', data: { delta: 'Ana.' } },
      {
        event: 'turn.completed',
        data: { message: reply, conversation: makeConversation(), usage: USAGE },
      },
    ]);
    expect(chunks.map((chunk) => chunk.type)).toEqual([
      'start',
      'data-step',
      'text-start',
      'text-delta',
      'text-delta',
      'text-end',
      'data-completed',
      'message-metadata',
      'finish',
    ]);
    expect(chunks[0]).toEqual({ type: 'start', messageId: REPLY_ID });
    expect(chunks[1]).toMatchObject({ id: step.id, data: step });
    expect(chunks[7]).toEqual({ type: 'message-metadata', messageMetadata: { message: reply } });
  });

  it('marca a falha do turno nos metadados sem lançar erro', async () => {
    const error = { code: 'agent_unavailable', message: 'Não consegui responder agora.' } as const;
    const chunks = await collect([{ event: 'turn.failed', data: { error, retryable: true } }]);
    expect(chunks).toContainEqual({
      type: 'message-metadata',
      messageMetadata: { failure: { message: 'Não consegui responder agora.', retryable: true } },
    });
  });

  it('avisa o aceite e a conversa pausada como dados transitórios', async () => {
    const message = makeChatMessage({ text: 'Oi' });
    const chunks = await collect([
      { event: 'message.accepted', data: { message, usage: USAGE } },
      { event: 'turn.skipped', data: { reason: 'with_analyst' } },
    ]);
    expect(chunks).toEqual([
      { type: 'data-accepted', data: { message, usage: USAGE }, transient: true },
      { type: 'data-skipped', data: { reason: 'with_analyst' }, transient: true },
      { type: 'finish' },
    ]);
  });

  it('lança interrupção quando o stream termina sem evento final', async () => {
    const started: ChatStreamEvent = { event: 'turn.started', data: { replyId: REPLY_ID } };
    await expect(collect([started])).rejects.toBeInstanceOf(InterruptedTurnError);
  });
});
