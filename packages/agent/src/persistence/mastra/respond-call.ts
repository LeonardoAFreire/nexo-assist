import type { MastraModelConfig } from '@mastra/core/llm';
import type { RespondInput } from '../../core/llm-client.js';
import type { LlmEvent } from '../../core/llm-event.js';
import { createModelAgent } from './create-model-agent.js';
import { type Deadline, startDeadline } from './deadline.js';
import { chooseToolChoice } from './tool-choice.js';
import { FirstEventTimeoutError, toModelFailure } from './model-failure.js';
import { readResponseStream, type StreamProgress } from './response-stream.js';
import { toModelMessages } from './to-model-messages.js';
import { ToolBridge } from './tool-bridge.js';

const MAX_OUTPUT_TOKENS_PER_STEP = 600;
const NO_RETRIES = 0;

export type SharedAttemptState = {
  turn: Deadline;
  progress: StreamProgress;
  firstEventTimeoutMs: number;
};

type ModelAgent = ReturnType<typeof createModelAgent>;
type OpenedStream = Awaited<ReturnType<ModelAgent['stream']>>;
type Interruptions = { deadlines: Deadline[]; bridge: ToolBridge };

async function openStream(
  agent: ModelAgent,
  input: RespondInput,
  interruptions: Interruptions,
): Promise<OpenedStream> {
  const { deadlines, bridge } = interruptions;
  const signals = deadlines.map((deadline) => deadline.signal);
  const abortSignal = AbortSignal.any([input.signal, bridge.signal, ...signals]);
  const opening = agent.stream(toModelMessages(input.messages), {
    maxSteps: input.maxSteps,
    prepareStep: ({ steps }) => ({ toolChoice: chooseToolChoice(input.finishingTools, steps) }),
    abortSignal,
    modelSettings: { maxOutputTokens: MAX_OUTPUT_TOKENS_PER_STEP, maxRetries: NO_RETRIES },
  });
  const expirations = deadlines.map((deadline) => deadline.expired);
  return Promise.race([opening, ...expirations]).catch((error: unknown) => {
    throw toModelFailure(error);
  });
}

export async function* respondOnce(
  model: MastraModelConfig,
  input: RespondInput,
  shared: SharedAttemptState,
): AsyncGenerator<LlmEvent> {
  const first = startDeadline(shared.firstEventTimeoutMs, () => new FirstEventTimeoutError());
  const bridge = new ToolBridge(input.tools, input.context);
  try {
    const tools = bridge.toMastraTools();
    const agent = createModelAgent({ model, instructions: input.instructions, tools });
    const deadlines = [shared.turn, first];
    const output = await openStream(agent, input, { deadlines, bridge });
    const { turn, progress } = shared;
    const guards = { turn, progress, first, bridge, callerSignal: input.signal };
    yield* readResponseStream(output.fullStream, guards);
  } finally {
    first.cancel();
  }
}
