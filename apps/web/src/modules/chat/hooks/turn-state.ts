import type { AgentStep, ChatStreamEvent, MessagePart } from '@nexo/contracts';

export type TurnError = {
  message: string;
  retryable: boolean;
};

export type TurnState = {
  status: 'idle' | 'streaming' | 'failed';
  pendingText: string | null;
  accepted: boolean;
  steps: AgentStep[];
  text: string;
  parts: MessagePart[];
  error: TurnError | null;
};

export type TurnAction =
  | { type: 'submitted'; text: string }
  | { type: 'retried' }
  | { type: 'event'; event: ChatStreamEvent }
  | { type: 'interrupted'; message: string };

export const idleTurn: TurnState = {
  status: 'idle',
  pendingText: null,
  accepted: false,
  steps: [],
  text: '',
  parts: [],
  error: null,
};
