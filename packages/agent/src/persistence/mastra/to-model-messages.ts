import type { ModelMessage } from 'ai';
import type { LlmMessage } from '../../core/llm-client.js';

function toModelMessage(message: LlmMessage): ModelMessage {
  if (message.role === 'user') {
    return { role: 'user', content: message.content };
  }
  return { role: 'assistant', content: message.content };
}

export function toModelMessages(messages: LlmMessage[]): ModelMessage[] {
  return messages.map(toModelMessage);
}
