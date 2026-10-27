import type { AgentHistoryEntry, AgentTurnInput, PendingAction } from '@nexo/contracts';
import type { LlmMessage } from './llm-client.js';

export const CONTEXT_WINDOW_SIZE = 20;
const DATA_TAG_OPEN = '<mensagem_do_funcionario>';
const DATA_TAG_CLOSE = '</mensagem_do_funcionario>';
const SYSTEM_LABEL = 'Sistema';

function asData(text: string): string {
  const safeText = text.replaceAll(DATA_TAG_CLOSE, '').replaceAll(DATA_TAG_OPEN, '');
  return `${DATA_TAG_OPEN}${safeText}${DATA_TAG_CLOSE}`;
}

function toMessage(entry: AgentHistoryEntry): LlmMessage {
  if (entry.author === 'employee') {
    return { role: 'user', content: asData(entry.text) };
  }
  const label = entry.author === 'system' ? SYSTEM_LABEL : entry.authorLabel;
  const content = entry.author === 'agent' ? entry.text : `[${label}] ${entry.text}`;
  return { role: 'assistant', content };
}

function describePendingAction(action: PendingAction): string {
  if (action.kind === 'create_ticket') {
    return `rascunho de chamado "${action.draft?.title ?? ''}" aguardando confirmação do funcionário`;
  }
  const label = action.kind === 'reopen_ticket' ? 'reabertura' : 'complemento';
  return `${label} do ${action.targetNumber ?? ''} aguardando confirmação do funcionário`;
}

function citedTicketNumbers(history: AgentHistoryEntry[]): string[] {
  const numbers = history
    .flatMap((entry) => entry.parts)
    .flatMap((part) => (part.type === 'ticket_card' ? [part.ticket.number] : []));
  return [...new Set(numbers)];
}

function buildContextBlock(input: AgentTurnInput, history: AgentHistoryEntry[]): string {
  const lines = [`Funcionário: ${input.requester.name}`];
  if (input.pendingAction?.status === 'pending') {
    lines.push(`Ação pendente: ${describePendingAction(input.pendingAction)}`);
  }
  const cited = citedTicketNumbers(history);
  if (cited.length > 0) {
    lines.push(`Chamados citados na conversa: ${cited.join(', ')}`);
  }
  return `<contexto>\n${lines.join('\n')}\n</contexto>`;
}

export class ContextBuilder {
  build(input: AgentTurnInput): LlmMessage[] {
    const history = input.history.slice(-CONTEXT_WINDOW_SIZE);
    const current = `${buildContextBlock(input, history)}\n${asData(input.userMessage)}`;
    return [...history.map(toMessage), { role: 'user', content: current }];
  }
}
