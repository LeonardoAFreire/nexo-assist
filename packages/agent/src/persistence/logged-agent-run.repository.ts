import type { AgentLogger } from '../core/agent-logger.js';
import type { AgentRun } from '../core/agent-run.js';
import type { AgentRunRepository } from '../core/agent-run-repository.js';

const TURN_COMPLETED_MESSAGE = 'turno concluído';

function toLogFields(run: AgentRun): Record<string, unknown> {
  return {
    conversationId: run.conversationId,
    runId: run.id,
    intent: run.intent,
    confidence: run.confidence,
    action: run.action,
    handoffReason: run.handoffReason,
    steps: run.steps.map((step) => step.kind),
    models: run.models,
    inputTokens: run.inputTokens,
    outputTokens: run.outputTokens,
    costUsd: run.costUsd,
    firstTokenMs: run.firstTokenMs,
    durationMs: run.durationMs,
    outcome: run.outcome,
  };
}

export class LoggedAgentRunRepository implements AgentRunRepository {
  constructor(
    private readonly inner: AgentRunRepository,
    private readonly logger: AgentLogger,
  ) {}

  async save(run: AgentRun): Promise<void> {
    await this.inner.save(run);
    this.logger.info(toLogFields(run), TURN_COMPLETED_MESSAGE);
  }

  costSince(since: Date): Promise<number> {
    return this.inner.costSince(since);
  }

  inputTokensOf(conversationId: string): Promise<number> {
    return this.inner.inputTokensOf(conversationId);
  }
}
