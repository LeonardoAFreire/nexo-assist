import type { MastraModelConfig } from '@mastra/core/llm';
import { type Understanding, understandingSchema } from '@nexo/contracts';
import type { LlmResult, UnderstandInput } from '../../core/llm-client.js';
import { createModelAgent } from './create-model-agent.js';
import { startDeadline } from './deadline.js';
import { TurnTimeoutError, toModelFailure } from './model-failure.js';
import { toTokenUsage } from './parse-chunk.js';
import { toModelMessages } from './to-model-messages.js';

const UNDERSTAND_TIMEOUT_MS = 6000;
const UNDERSTAND_MAX_OUTPUT_TOKENS = 300;
const UNDERSTAND_TEMPERATURE = 0;
const NO_RETRIES = 0;

export async function understandOnce(
  model: MastraModelConfig,
  input: UnderstandInput,
): Promise<LlmResult<Understanding>> {
  const deadline = startDeadline(UNDERSTAND_TIMEOUT_MS, () => new TurnTimeoutError());
  try {
    const agent = createModelAgent({ model, instructions: input.instructions });
    const generation = agent.generate(toModelMessages(input.messages), {
      structuredOutput: { schema: understandingSchema },
      abortSignal: deadline.signal,
      modelSettings: {
        temperature: UNDERSTAND_TEMPERATURE,
        maxOutputTokens: UNDERSTAND_MAX_OUTPUT_TOKENS,
        maxRetries: NO_RETRIES,
      },
    });
    const result = await Promise.race([generation, deadline.expired]);
    const value = understandingSchema.parse(result.object);
    return { value, usage: toTokenUsage(result.usage) };
  } catch (error: unknown) {
    throw toModelFailure(error);
  } finally {
    deadline.cancel();
  }
}
