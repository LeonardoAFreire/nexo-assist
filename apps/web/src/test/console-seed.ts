import type { AgentTurn, HandoffInfo } from '@nexo/contracts';
import type { ConsoleRecord } from './console-backend-state';
import { makeConversation, makeEmployee, makeItem, makeMessage } from './console-fixtures';

const turn: AgentTurn = {
  steps: [],
  decision: {
    understood: {
      intent: 'ticket_status',
      intentLabel: 'consultar chamado',
      summary: 'INC-20311 parado',
      entities: [],
    },
    action: { kind: 'replied', label: 'perguntou se quer um analista' },
    confidence: { value: 0.41, label: 'baixa' },
    reason: 'chamado vencido',
    rules: [],
    handoff: null,
  },
};

const handoff: HandoffInfo = {
  reason: 'requested',
  level: 'N2',
  summary: 'Notebook lento desde a atualização do Windows.',
  ticketNumbers: ['INC-20311'],
  confidence: null,
  contactDueAt: '2026-10-27T13:30:00.000Z',
  handedOffAt: '2026-10-27T13:05:00.000Z',
};

function makeRecord(
  name: string,
  initials: string,
  overrides: Partial<ConsoleRecord>,
): ConsoleRecord {
  const conversation = makeConversation({ employee: makeEmployee({ name, initials }) });
  const item = makeItem(conversation);
  return { conversation, item, timeline: [], ...overrides };
}

function makeTransferredRecord(): ConsoleRecord {
  const record = makeRecord('Ana Souza', 'AS', {});
  const id = record.item.id;
  record.conversation = { ...record.conversation, handoff };
  record.item = {
    ...record.item,
    statusDetail: 'INC-20311',
    ticketNumbers: ['INC-20311'],
    unreadCount: 2,
  };
  const agentMessage = {
    conversationId: id,
    author: 'agent',
    authorName: null,
    text: 'Quer que eu chame um analista?',
    turn,
  } as const;
  record.timeline = [
    makeMessage({ conversationId: id, text: 'Está parado há 5 dias.' }),
    makeMessage(agentMessage),
  ];
  return record;
}

function makeAgentRecord(): ConsoleRecord {
  const record = makeRecord('Bruno Tavares', 'BT', {});
  record.conversation = { ...record.conversation, state: 'agent' };
  record.item = { ...record.item, consoleStatus: 'agent_attending' };
  return record;
}

export function seedRecords(): ConsoleRecord[] {
  return [makeTransferredRecord(), makeAgentRecord()];
}
