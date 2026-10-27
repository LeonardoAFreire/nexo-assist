import type { AgentRunRepository } from './agent-run-repository.js';

export const CONVERSATION_TOKEN_BUDGET = 600_000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type BudgetVerdict = 'available' | 'daily_exhausted' | 'conversation_exhausted';

export class BudgetGuard {
  constructor(
    private readonly runs: AgentRunRepository,
    private readonly dailyBudgetUsd: number,
  ) {}

  async check(conversationId: string, now: Date): Promise<BudgetVerdict> {
    const since = new Date(now.getTime() - DAILY_WINDOW_MS);
    if ((await this.runs.costSince(since)) >= this.dailyBudgetUsd) {
      return 'daily_exhausted';
    }
    const used = await this.runs.inputTokensOf(conversationId);
    return used >= CONVERSATION_TOKEN_BUDGET ? 'conversation_exhausted' : 'available';
  }
}
