import { TicketsUnavailableError } from '@nexo/contracts';
import { ZodError } from 'zod';
import type { AgentTool } from './agent-tool.js';
import { ArticleNotSearchedError } from './tools/article-not-searched.error.js';

export type DegradationCause = 'legacy_unavailable' | 'step_limit';
export type ToolFailure = { error: string };

const GENERIC_TOOL_ERROR = 'A ferramenta não conseguiu concluir. Siga sem esse resultado.';

export class StepLimitReachedError extends Error {
  constructor(limit: number) {
    super(`Limite de ${limit} passos por turno atingido.`);
    this.name = 'StepLimitReachedError';
  }
}

function describeToolError(error: unknown): string {
  if (error instanceof ArticleNotSearchedError) {
    return error.message;
  }
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    return `Argumentos inválidos (${issues.join('; ')}).`;
  }
  return GENERIC_TOOL_ERROR;
}

export class ToolGuard {
  private executed = 0;
  private degradation: DegradationCause | null = null;

  constructor(private readonly maxSteps: number) {}

  get cause(): DegradationCause | null {
    return this.degradation;
  }

  wrap(tool: AgentTool): AgentTool {
    return { ...tool, execute: (input, context) => this.run(tool, [input, context]) };
  }

  private async run(tool: AgentTool, args: Parameters<AgentTool['execute']>): Promise<unknown> {
    if (this.executed >= this.maxSteps) {
      this.degradation = 'step_limit';
      throw new StepLimitReachedError(this.maxSteps);
    }
    this.executed += 1;
    try {
      return await tool.execute(...args);
    } catch (error: unknown) {
      if (error instanceof TicketsUnavailableError) {
        this.degradation = 'legacy_unavailable';
        throw error;
      }
      return { error: describeToolError(error) } satisfies ToolFailure;
    }
  }
}
