import type {
  AgentDecision,
  AgentStep,
  ChatMessage,
  Conversation,
  EmployeeConversationView,
} from '@nexo/contracts';

const MESSAGE_TIME = '2026-10-27T13:00:00.000Z';
const EMPLOYEE_ID = '6f1c2a8e-3b7d-4e55-9a10-1d2f3c4b5a61';
const CONVERSATION_ID = 'c71a0000-0000-4400-8000-000000000001';

export const MESSAGES_LIMIT = 30;

export function makeChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: crypto.randomUUID(),
    conversationId: CONVERSATION_ID,
    author: 'employee',
    authorName: null,
    authorLevel: null,
    text: 'Olá',
    parts: [],
    turn: null,
    status: 'complete',
    createdAt: MESSAGE_TIME,
    ...overrides,
  };
}

export function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  const employee = {
    id: EMPLOYEE_ID,
    name: 'Ana Souza',
    role: 'employee',
    department: 'Financeiro',
    supportLevel: null,
    initials: 'AS',
  } as const;
  return {
    id: CONVERSATION_ID,
    employee,
    state: 'agent',
    resolution: null,
    assignedAnalyst: null,
    handoff: null,
    pendingAction: null,
    lastMessageAt: MESSAGE_TIME,
    ...overrides,
  };
}

export function makeConversationView(
  overrides: Partial<EmployeeConversationView> = {},
): EmployeeConversationView {
  return {
    conversation: null,
    timeline: [],
    usage: { messagesUsed: 0, messagesLimit: MESSAGES_LIMIT },
    turnInProgress: false,
    ...overrides,
  };
}

export function makeStep(overrides: Partial<AgentStep> = {}): AgentStep {
  return {
    id: 's1',
    kind: 'searched_tickets',
    label: 'consultou seus chamados',
    result: '3 chamados encontrados',
    status: 'ok',
    attempts: 1,
    durationMs: 98,
    ...overrides,
  };
}

export function makeDecision(): AgentDecision {
  return {
    understood: {
      intent: 'ticket_status',
      intentLabel: 'consultar chamado',
      summary: 'status',
      entities: [],
    },
    action: { kind: 'replied', label: 'respondeu' },
    confidence: { value: 0.9, label: 'alta' },
    reason: 'pedido de status',
    rules: [],
    handoff: null,
  };
}
