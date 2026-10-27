import type { Understanding } from '@nexo/contracts';
import type { LlmClient, LlmResult, RespondInput } from '../../core/llm-client.js';
import type { LlmEvent } from '../../core/llm-event.js';
import type { TokenUsage } from '../../core/token-usage.js';

const WORD_WITH_TRAILING_SPACE = /\S+\s*/g;
const NO_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 };

export type ScriptedToolCall = { name: string; input: unknown };

export type ScriptedEntry =
  | { type: 'understand'; understanding: Understanding; usage?: TokenUsage }
  | { type: 'respond'; text: string; toolCalls?: ScriptedToolCall[]; usage?: TokenUsage };

export class UnscriptedLlmCallError extends Error {
  constructor(message: string) {
    super(`Chamada ao modelo fora do roteiro: ${message}`);
    this.name = 'UnscriptedLlmCallError';
  }
}

export class ScriptedLlmClient implements LlmClient {
  private readonly queue: ScriptedEntry[];

  constructor(script: ScriptedEntry[]) {
    this.queue = [...script];
  }

  get remaining(): number {
    return this.queue.length;
  }

  async understand(): Promise<LlmResult<Understanding>> {
    const entry = this.queue.shift();
    if (entry?.type !== 'understand') {
      throw new UnscriptedLlmCallError(`understand, mas o roteiro previa ${entry?.type ?? 'nada'}`);
    }
    return { value: entry.understanding, usage: entry.usage ?? NO_USAGE };
  }

  async *respond(input: RespondInput): AsyncIterable<LlmEvent> {
    const entry = this.queue.shift();
    if (entry?.type !== 'respond') {
      throw new UnscriptedLlmCallError(`respond, mas o roteiro previa ${entry?.type ?? 'nada'}`);
    }
    for (const call of entry.toolCalls ?? []) {
      await runToolCall(call, input);
    }
    for (const delta of entry.text.match(WORD_WITH_TRAILING_SPACE) ?? []) {
      input.signal.throwIfAborted();
      yield { type: 'text-delta', delta };
    }
    yield { type: 'finished', usage: entry.usage ?? NO_USAGE };
  }
}

async function runToolCall(call: ScriptedToolCall, input: RespondInput): Promise<void> {
  const tool = input.tools.find((candidate) => candidate.name === call.name);
  if (!tool) {
    throw new UnscriptedLlmCallError(`ferramenta ${call.name} não oferecida neste turno`);
  }
  await tool.execute(call.input, input.context);
}
