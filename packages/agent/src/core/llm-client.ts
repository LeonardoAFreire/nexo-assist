import type { Understanding } from '@nexo/contracts';
import type { AgentTool } from './agent-tool.js';
import type { LlmEvent } from './llm-event.js';
import type { TokenUsage } from './token-usage.js';
import type { TurnContext } from './turn-context.js';

export type LlmMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type LlmResult<T> = {
  value: T;
  usage: TokenUsage;
};

export type UnderstandInput = {
  instructions: string;
  messages: LlmMessage[];
};

export type RespondInput = UnderstandInput & {
  tools: AgentTool[];
  maxSteps: number;
  finishingTools: string[];
  context: TurnContext;
  signal: AbortSignal;
};

export interface LlmClient {
  understand(input: UnderstandInput): Promise<LlmResult<Understanding>>;
  respond(input: RespondInput): AsyncIterable<LlmEvent>;
}
