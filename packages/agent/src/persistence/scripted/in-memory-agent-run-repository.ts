import type { AgentRun } from '../../core/agent-run.js';
import type { AgentRunRepository } from '../../core/agent-run-repository.js';

export class InMemoryAgentRunRepository implements AgentRunRepository {
  readonly saved: AgentRun[] = [];

  constructor(private readonly history: AgentRun[] = []) {}

  async save(run: AgentRun): Promise<void> {
    this.saved.push(run);
  }

  async costSince(since: Date): Promise<number> {
    return this.all()
      .filter((run) => new Date(run.createdAt).getTime() >= since.getTime())
      .reduce((total, run) => total + run.costUsd, 0);
  }

  async inputTokensOf(conversationId: string): Promise<number> {
    return this.all()
      .filter((run) => run.conversationId === conversationId)
      .reduce((total, run) => total + run.inputTokens, 0);
  }

  private all(): AgentRun[] {
    return [...this.history, ...this.saved];
  }
}
