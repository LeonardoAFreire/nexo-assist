import { describe, expect, it } from 'vitest';
import { InMemoryAgentRunRepository } from '../persistence/scripted/in-memory-agent-run-repository.js';
import type { AgentRun } from './agent-run.js';
import { BudgetGuard, CONVERSATION_TOKEN_BUDGET } from './budget-guard.js';

const CONVERSATION_ID = '4f0a1c9e-3d6b-4a52-9b8e-7c1d2e3f4a5b';
const DAILY_BUDGET_USD = 1000;
const MESSAGES_PER_SESSION = 30;
const INPUT_TOKENS_PER_REAL_TURN = 15_000;

function makeRun(index: number): AgentRun {
  return {
    id: `run-${index}`,
    conversationId: CONVERSATION_ID,
    intent: 'ticket_open',
    confidence: 0.9,
    action: 'replied',
    handoffReason: null,
    steps: [],
    models: ['response-model'],
    inputTokens: INPUT_TOKENS_PER_REAL_TURN,
    outputTokens: 400,
    costUsd: 0.0025,
    firstTokenMs: 3000,
    durationMs: 9000,
    outcome: 'answered',
    createdAt: new Date().toISOString(),
  };
}

describe('BudgetGuard', () => {
  it('CA-25: mantém a conversa disponível até a 30ª mensagem com o consumo real por turno', async () => {
    const previousTurns = Array.from({ length: MESSAGES_PER_SESSION - 1 }, (_, index) =>
      makeRun(index),
    );
    const guard = new BudgetGuard(new InMemoryAgentRunRepository(previousTurns), DAILY_BUDGET_USD);
    expect(await guard.check(CONVERSATION_ID, new Date())).toBe('available');
  });

  it('esgota a conversa quando os tokens passam do orçamento', async () => {
    const spent = { ...makeRun(0), inputTokens: CONVERSATION_TOKEN_BUDGET };
    const guard = new BudgetGuard(new InMemoryAgentRunRepository([spent]), DAILY_BUDGET_USD);
    expect(await guard.check(CONVERSATION_ID, new Date())).toBe('conversation_exhausted');
  });
});
