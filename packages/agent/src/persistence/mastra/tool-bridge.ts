import { createTool } from '@mastra/core/tools';
import type { AgentTool } from '../../core/agent-tool.js';
import type { TurnContext } from '../../core/turn-context.js';

type MastraTool = ReturnType<typeof createTool>;

export class ToolBridge {
  private failure: { error: unknown } | null = null;
  private readonly controller = new AbortController();

  constructor(
    private readonly tools: AgentTool[],
    private readonly context: TurnContext,
  ) {}

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get fatal(): { error: unknown } | null {
    return this.failure;
  }

  toMastraTools(): Record<string, MastraTool> {
    const entries = this.tools.map((tool) => [tool.name, this.convert(tool)] as const);
    return Object.fromEntries(entries);
  }

  private convert(tool: AgentTool): MastraTool {
    return createTool({
      id: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: (input) => this.execute(tool, input),
    });
  }

  private async execute(tool: AgentTool, input: unknown): Promise<unknown> {
    try {
      return await tool.execute(input, this.context);
    } catch (error: unknown) {
      this.failure = { error };
      this.controller.abort(error);
      throw error;
    }
  }
}
