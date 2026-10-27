import type { AgentRun } from './agent-run.js';

export interface AgentRunRepository {
  save(run: AgentRun): Promise<void>;
  costSince(since: Date): Promise<number>;
}
