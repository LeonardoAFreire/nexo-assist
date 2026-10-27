import { type Understanding, understandingSchema } from '@nexo/contracts';
import type { LlmClient, LlmMessage, LlmResult } from './llm-client.js';
import type { PromptCatalog } from './prompt-catalog.js';

export class UnderstandingStep {
  constructor(
    private readonly llm: LlmClient,
    private readonly prompts: PromptCatalog,
  ) {}

  async run(messages: LlmMessage[]): Promise<LlmResult<Understanding>> {
    const instructions = this.prompts.understanding();
    const result = await this.llm.understand({ instructions, messages });
    return { value: understandingSchema.parse(result.value), usage: result.usage };
  }
}
