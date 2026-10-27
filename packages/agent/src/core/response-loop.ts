import type { AgentTool } from './agent-tool.js';
import type { LlmClient, LlmMessage } from './llm-client.js';
import { type DegradationCause, ToolGuard } from './tool-guard.js';
import type { TokenUsage } from './token-usage.js';
import type { TurnContext } from './turn-context.js';

export const MAX_STEPS_PER_TURN = 6;
const NO_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 };

export type LoopInput = {
  instructions: string;
  messages: LlmMessage[];
  tools: AgentTool[];
  requireToolFirst: boolean;
};

export type LoopResult = {
  usage: TokenUsage;
  cause: DegradationCause | null;
};

export class ResponseLoop {
  constructor(private readonly llm: LlmClient) {}

  async run(input: LoopInput, context: TurnContext, signal: AbortSignal): Promise<LoopResult> {
    const guard = new ToolGuard(MAX_STEPS_PER_TURN);
    const tools = input.tools.map((tool) => guard.wrap(tool));
    const { instructions, messages, requireToolFirst } = input;
    const request = {
      instructions,
      messages,
      tools,
      requireToolFirst,
      maxSteps: MAX_STEPS_PER_TURN,
      context,
      signal,
    };
    let usage = NO_USAGE;
    try {
      for await (const event of this.llm.respond(request)) {
        if (event.type === 'text-delta') {
          context.emit({ type: 'text-delta', delta: event.delta });
        } else {
          usage = event.usage;
        }
      }
    } catch (error: unknown) {
      if (guard.cause === null) {
        throw error;
      }
    }
    return { usage, cause: guard.cause };
  }
}
