import type { AgentHistoryEntry, AgentTurnInput, ChatMessage } from '@nexo/contracts';
import type { MessageRepository } from '../messages/message-repository.js';
import type { PendingActionRecord } from '../pending-actions/pending-action-record.js';
import { toPendingAction } from '../pending-actions/to-pending-action.js';
import type { TurnContext } from './turn-context.js';

export const AGENT_HISTORY_LIMIT = 20;
const AGENT_LABEL = 'Assistente Nexo';
const SYSTEM_LABEL = 'Sistema';
const ANALYST_FALLBACK_NAME = 'sem nome';

function authorLabel(message: ChatMessage, employeeName: string): string {
  if (message.author === 'employee') {
    return employeeName;
  }
  if (message.author === 'analyst') {
    const name = message.authorName ?? ANALYST_FALLBACK_NAME;
    return `Analista ${name} (${message.authorLevel ?? 'N1'})`;
  }
  return message.author === 'agent' ? AGENT_LABEL : SYSTEM_LABEL;
}

function toHistoryEntry(message: ChatMessage, employeeName: string): AgentHistoryEntry {
  return {
    author: message.author,
    authorLabel: authorLabel(message, employeeName),
    text: message.text,
    parts: message.parts,
  };
}

export type BuildAgentTurnInput = {
  context: TurnContext;
  pending: PendingActionRecord | null;
};

export async function buildAgentTurnInput(
  messages: Pick<MessageRepository, 'listRecent'>,
  input: BuildAgentTurnInput,
): Promise<AgentTurnInput> {
  const { context } = input;
  const recent = await messages.listRecent({
    conversationId: context.conversation.id,
    limit: AGENT_HISTORY_LIMIT + 1,
  });
  const history = recent
    .filter((message) => message.id !== context.employeeMessage.id && message.status === 'complete')
    .slice(-AGENT_HISTORY_LIMIT)
    .map((message) => toHistoryEntry(message, context.session.userName));
  return {
    conversationId: context.conversation.id,
    requester: { id: context.session.userId, name: context.session.userName },
    history,
    pendingAction: input.pending === null ? null : toPendingAction(input.pending),
    userMessage: context.agentText,
    signal: context.signal,
  };
}
