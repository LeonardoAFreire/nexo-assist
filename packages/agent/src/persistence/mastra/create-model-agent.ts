import { Agent } from '@mastra/core/agent';
import type { MastraModelConfig } from '@mastra/core/llm';
import { noopLogger } from '@mastra/core/logger';
import type { createTool } from '@mastra/core/tools';

const AGENT_ID = 'nexo-assist';

export type ModelAgentOptions = {
  model: MastraModelConfig;
  instructions: string;
  tools?: Record<string, ReturnType<typeof createTool>>;
};

export function createModelAgent(options: ModelAgentOptions): Agent {
  const agent = new Agent({ id: AGENT_ID, name: AGENT_ID, ...options });
  agent.__registerPrimitives({ logger: noopLogger });
  return agent;
}
