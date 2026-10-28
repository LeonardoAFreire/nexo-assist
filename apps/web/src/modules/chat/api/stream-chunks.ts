import type { ChatStreamEvent } from '@nexo/contracts';
import type { NexoChunk } from '../types/nexo-ui-message.js';

const TEXT_ID = 'reply-text';
const INTERRUPTED_MESSAGE = 'A resposta foi interrompida. Tente de novo.';

type TerminalEvent = Extract<
  ChatStreamEvent,
  { event: 'turn.completed' | 'turn.skipped' | 'turn.failed' }
>;

export class InterruptedTurnError extends Error {
  constructor() {
    super(INTERRUPTED_MESSAGE);
    this.name = 'InterruptedTurnError';
  }
}

class ChunkMapper {
  private textOpen = false;
  private partCount = 0;

  map(event: ChatStreamEvent): NexoChunk[] {
    switch (event.event) {
      case 'message.accepted':
        return [{ type: 'data-accepted', data: event.data, transient: true }];
      case 'turn.started':
        return [{ type: 'start', messageId: event.data.replyId }];
      case 'turn.step':
        return [{ type: 'data-step', id: event.data.step.id, data: event.data.step }];
      case 'turn.text-delta':
        return [...this.openText(), { type: 'text-delta', id: TEXT_ID, delta: event.data.delta }];
      case 'turn.part':
        return [{ type: 'data-part', id: `part-${this.partCount++}`, data: event.data.part }];
      default:
        return [...this.closeText(), ...finishChunks(event), { type: 'finish' }];
    }
  }

  private openText(): NexoChunk[] {
    if (this.textOpen) {
      return [];
    }
    this.textOpen = true;
    return [{ type: 'text-start', id: TEXT_ID }];
  }

  private closeText(): NexoChunk[] {
    return this.textOpen ? [{ type: 'text-end', id: TEXT_ID }] : [];
  }
}

function finishChunks(event: TerminalEvent): NexoChunk[] {
  switch (event.event) {
    case 'turn.completed': {
      const { message, conversation, usage } = event.data;
      const completed = { conversation, usage };
      return [
        { type: 'data-completed', data: completed, transient: true },
        { type: 'message-metadata', messageMetadata: { message } },
      ];
    }
    case 'turn.skipped':
      return [{ type: 'data-skipped', data: event.data, transient: true }];
    case 'turn.failed': {
      const failure = { message: event.data.error.message, retryable: event.data.retryable };
      return [{ type: 'message-metadata', messageMetadata: { failure } }];
    }
  }
}

function isTerminal(event: ChatStreamEvent): event is TerminalEvent {
  return ['turn.completed', 'turn.skipped', 'turn.failed'].includes(event.event);
}

export async function* toChunks(events: AsyncIterable<ChatStreamEvent>): AsyncGenerator<NexoChunk> {
  const mapper = new ChunkMapper();
  for await (const event of events) {
    yield* mapper.map(event);
    if (isTerminal(event)) {
      return;
    }
  }
  throw new InterruptedTurnError();
}
