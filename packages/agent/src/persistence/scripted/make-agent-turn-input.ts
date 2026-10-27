import type { AgentHistoryEntry, AgentTurnInput } from '@nexo/contracts';

const CONVERSATION_ID = '4f0a1c9e-3d6b-4a52-9b8e-7c1d2e3f4a5b';
const REQUESTER_ID = '0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d';

export function makeHistoryEntry(overrides: Partial<AgentHistoryEntry> = {}): AgentHistoryEntry {
  return {
    author: 'employee',
    authorLabel: 'Ana Souza',
    text: 'Olá',
    parts: [],
    ...overrides,
  };
}

export function makeAgentTurnInput(overrides: Partial<AgentTurnInput> = {}): AgentTurnInput {
  return {
    conversationId: CONVERSATION_ID,
    requester: { id: REQUESTER_ID, name: 'Ana Souza' },
    history: [],
    pendingAction: null,
    userMessage: 'Minha VPN não conecta',
    signal: new AbortController().signal,
    ...overrides,
  };
}
