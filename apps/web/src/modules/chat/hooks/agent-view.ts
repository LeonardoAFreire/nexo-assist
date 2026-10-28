import type { AgentDecision, AgentStep, ChatMessage, MessagePart } from '@nexo/contracts';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';

export type AgentView = {
  messageId: string;
  text: string;
  steps: AgentStep[];
  parts: MessagePart[];
  decision: AgentDecision | null;
  busy: boolean;
};

export function liveText(message: NexoUIMessage): string {
  return message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('');
}

function fromPersisted(message: ChatMessage): AgentView {
  return {
    messageId: message.id,
    text: message.text,
    steps: message.turn?.steps ?? [],
    parts: message.parts,
    decision: message.turn?.decision ?? null,
    busy: false,
  };
}

function fromLive(message: NexoUIMessage, busy: boolean): AgentView {
  const { parts } = message;
  return {
    messageId: message.id,
    text: liveText(message),
    steps: parts.flatMap((part) => (part.type === 'data-step' ? [part.data] : [])),
    parts: parts.flatMap((part) => (part.type === 'data-part' ? [part.data] : [])),
    decision: null,
    busy,
  };
}

export function agentView(message: NexoUIMessage, streamingId: string | null): AgentView | null {
  const persisted = message.metadata?.message;
  if (persisted !== undefined) {
    return persisted.author === 'agent' ? fromPersisted(persisted) : null;
  }
  if (message.role !== 'assistant') {
    return null;
  }
  return fromLive(message, message.id === streamingId);
}
