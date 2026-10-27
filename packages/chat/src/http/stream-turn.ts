import type { ChatStreamEvent } from '@nexo/contracts';
import { SseResponse, type SseTarget } from '@nexo/shared/http';
import { withChatErrors } from './chat-error.mapper.js';

const STREAM_FAILURE_MESSAGE = 'Não consegui concluir a resposta. Tente de novo.';

export type OpenTurn = (signal: AbortSignal) => Promise<AsyncIterable<ChatStreamEvent>>;

export async function streamTurn(target: SseTarget, openTurn: OpenTurn): Promise<void> {
  const disconnect = new AbortController();
  target.on('close', () => disconnect.abort());
  const events = await withChatErrors(() => openTurn(disconnect.signal));
  const sse = new SseResponse(target);
  sse.open();
  try {
    for await (const event of events) {
      sse.send(event.event, event.data);
    }
  } catch {
    sse.send('turn.failed', {
      error: { code: 'internal_error', message: STREAM_FAILURE_MESSAGE },
      retryable: false,
    });
  } finally {
    sse.close();
  }
}
