import type { AgentStep, HandoffReason } from '@nexo/contracts';

export type AgentRunOutcome = 'answered' | 'handed_off' | 'degraded' | 'failed';

export type AgentRun = {
  id: string;
  conversationId: string;
  intent: string | null;
  confidence: number | null;
  action: string;
  handoffReason: HandoffReason | null;
  steps: AgentStep[];
  models: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  firstTokenMs: number | null;
  durationMs: number;
  outcome: AgentRunOutcome;
  createdAt: string;
};
