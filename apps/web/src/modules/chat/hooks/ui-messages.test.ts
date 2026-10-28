import { describe, expect, it } from 'vitest';
import { makeChatMessage } from '@/test/chat-factories';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';
import { applyTimelineUpdate, appendUnique, attachAccepted, toUIMessage } from './ui-messages.js';

const CLIENT_ID = '5e2a0000-0000-4000-8000-000000000001';

function optimistic(text: string): NexoUIMessage {
  return { id: CLIENT_ID, role: 'user', parts: [{ type: 'text', text }] };
}

describe('applyTimelineUpdate', () => {
  it('troca a mensagem otimista pela salva com o mesmo id, sem duplicar nem mudar a chave', () => {
    const saved = makeChatMessage({ id: CLIENT_ID, text: 'Oi' });
    const next = applyTimelineUpdate([optimistic('Oi')], (timeline) =>
      appendUnique(timeline, saved),
    );
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: CLIENT_ID, metadata: { message: saved } });
  });

  it('acrescenta no fim a mensagem nova e mantém a resposta em andamento no lugar', () => {
    const live: NexoUIMessage = { id: 'reply', role: 'assistant', parts: [] };
    const analyst = makeChatMessage({ author: 'analyst', text: 'Assumi a conversa.' });
    const next = applyTimelineUpdate([optimistic('Oi'), live], (timeline) =>
      appendUnique(timeline, analyst),
    );
    expect(next.map((message) => message.id)).toEqual([CLIENT_ID, 'reply', analyst.id]);
  });
});

describe('attachAccepted', () => {
  it('anexa a mensagem aceita à otimista mesmo quando o servidor usa outro id', () => {
    const saved = makeChatMessage({ text: 'Oi' });
    const next = attachAccepted([optimistic('Oi')], saved);
    expect(next).toEqual([{ ...toUIMessage(saved), id: CLIENT_ID }]);
  });

  it('atualiza no lugar a mensagem que o evento da conversa já confirmou', () => {
    const saved = makeChatMessage({ id: CLIENT_ID, text: 'Oi' });
    const confirmed = { ...toUIMessage(saved) };
    expect(attachAccepted([confirmed], saved)).toEqual([toUIMessage(saved)]);
  });
});
