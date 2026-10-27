import type {
  ChatMessage,
  ConsoleEmployeeTickets,
  ConsoleConversationItem,
  ConsoleFilter,
  ConsoleList,
  Conversation,
  UserProfile,
} from '@nexo/contracts';
import type { HttpHandler } from 'msw';
import { makeMessage } from './console-fixtures';

export type ConsoleRecord = {
  conversation: Conversation;
  item: ConsoleConversationItem;
  timeline: ChatMessage[];
};

export type ConsoleStreamEventName =
  | 'console.item.updated'
  | 'conversation.updated'
  | 'message.created';

type StreamClient = {
  send: (payload: { event: ConsoleStreamEventName; data: unknown }) => void;
};

export type ConsoleBackend = {
  records: ConsoleRecord[];
  analyst: UserProfile;
  tickets: ConsoleEmployeeTickets | null;
  client: StreamClient | null;
  handlers: HttpHandler[];
};

export function requireRecord(backend: ConsoleBackend, id: string | readonly string[] | undefined) {
  const record = backend.records.find((current) => current.item.id === id);
  if (!record) {
    throw new Error(`Conversa de teste não encontrada: ${String(id)}`);
  }
  return record;
}

function matchesFilter(record: ConsoleRecord, filter: ConsoleFilter, analystId: string): boolean {
  const { state, assignedAnalyst } = record.conversation;
  const byFilter: Record<ConsoleFilter, boolean> = {
    all: true,
    for_you: state === 'waiting_analyst',
    with_agent: state === 'agent',
    mine: state === 'with_analyst' && assignedAnalyst?.id === analystId,
  };
  return byFilter[filter];
}

function matchesSearch(record: ConsoleRecord, q: string): boolean {
  const term = q.toLowerCase();
  const name = record.item.employee.name.toLowerCase();
  const numbers = record.item.ticketNumbers.map((number) => number.toLowerCase());
  return name.includes(term) || numbers.some((number) => number.includes(term));
}

export function buildList(records: ConsoleRecord[], query: URLSearchParams, analyst: UserProfile) {
  const filter = (query.get('filter') ?? 'all') as ConsoleFilter;
  const searched = records.filter((record) => matchesSearch(record, query.get('q') ?? ''));
  const count = (kind: ConsoleFilter) =>
    searched.filter((record) => matchesFilter(record, kind, analyst.id)).length;
  const items = searched.filter((record) => matchesFilter(record, filter, analyst.id));
  const list: ConsoleList = {
    items: items.map((record) => record.item),
    counters: {
      all: count('all'),
      for_you: count('for_you'),
      with_agent: count('with_agent'),
      mine: count('mine'),
    },
  };
  return list;
}

export function claimRecord(record: ConsoleRecord, analyst: UserProfile): void {
  record.conversation = { ...record.conversation, state: 'with_analyst', assignedAnalyst: analyst };
  record.item = { ...record.item, consoleStatus: 'you_are_attending' };
  const text = `${analyst.name} assumiu · agent pausado · 10:12`;
  const message = makeMessage({ conversationId: record.item.id, author: 'system', text });
  record.timeline = [...record.timeline, message];
}

export function setState(record: ConsoleRecord, state: Conversation['state']): void {
  const status = state === 'agent' ? 'agent_attending' : 'closed';
  record.conversation = { ...record.conversation, state };
  record.item = { ...record.item, consoleStatus: status };
}
