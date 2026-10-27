import type {
  ChatMessage,
  ConsoleConversationItem,
  Conversation,
  TicketSummary,
  UserProfile,
} from '@nexo/contracts';

const NOW = '2026-10-27T13:05:00.000Z';

export function makeEmployee(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: crypto.randomUUID(),
    name: 'Ana Souza',
    role: 'employee',
    department: 'Financeiro',
    supportLevel: null,
    initials: 'AS',
    ...overrides,
  };
}

export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: crypto.randomUUID(),
    employee: makeEmployee(),
    state: 'waiting_analyst',
    resolution: null,
    assignedAnalyst: null,
    handoff: null,
    pendingAction: null,
    lastMessageAt: NOW,
    ...overrides,
  };
}

export function makeItem(
  conversation: Conversation,
  overrides: Partial<ConsoleConversationItem> = {},
) {
  const item: ConsoleConversationItem = {
    id: conversation.id,
    employee: conversation.employee,
    lastMessage: { preview: 'Quero falar com um analista.', author: 'employee', at: NOW },
    unreadCount: 0,
    consoleStatus: 'transferred',
    statusDetail: null,
    ticketNumbers: [],
    ...overrides,
  };
  return item;
}

export function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: crypto.randomUUID(),
    conversationId: crypto.randomUUID(),
    author: 'employee',
    authorName: 'Ana Souza',
    authorLevel: null,
    text: 'Está parado há 5 dias.',
    parts: [],
    turn: null,
    status: 'complete',
    createdAt: NOW,
    ...overrides,
  };
}

export function makeTicketSummary(overrides: Partial<TicketSummary> = {}): TicketSummary {
  return {
    number: 'INC-20311',
    type: 'incident',
    title: 'Notebook lento após atualização',
    category: 'hardware',
    priority: 'medium',
    status: 'in_service',
    openedAt: '2026-10-14T13:20:00.000Z',
    lastUpdatedAt: '2026-10-20T13:20:00.000Z',
    resolvedAt: null,
    dueAt: null,
    overdue: false,
    latestEvent: null,
    ...overrides,
  };
}
