import type { MastraModelConfig } from '@mastra/core/llm';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';

type Chunk = Record<string, unknown>;
type StreamFactory = () => Promise<{ stream: ReadableStream<never> }>;

const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

export const STREAM_START: Chunk = { type: 'stream-start', warnings: [] };

export function textChunks(text: string): Chunk[] {
  return [
    STREAM_START,
    { type: 'text-start', id: 't' },
    { type: 'text-delta', id: 't', delta: text },
    { type: 'text-end', id: 't' },
    { type: 'finish', usage: USAGE, finishReason: { unified: 'stop', raw: undefined } },
  ];
}

export function toolCallChunks(toolName: string, input: unknown): Chunk[] {
  return [
    STREAM_START,
    { type: 'tool-call', toolCallId: 'call-1', toolName, input: JSON.stringify(input) },
    { type: 'finish', usage: USAGE, finishReason: { unified: 'tool-calls', raw: undefined } },
  ];
}

export function streamOf(chunks: Chunk[]): StreamFactory {
  return async () => ({ stream: simulateReadableStream({ chunks }) as ReadableStream<never> });
}

export function failingStream(statusCode?: number): StreamFactory {
  return async () => {
    throw Object.assign(new Error('detalhe interno do provedor'), { statusCode });
  };
}

export function scriptedModel(factories: StreamFactory[]): MockLanguageModelV4 {
  let call = 0;
  return new MockLanguageModelV4({
    doStream: async () => {
      const factory = factories[Math.min(call, factories.length - 1)];
      call += 1;
      return (factory as StreamFactory)() as never;
    },
  });
}

export function asModelConfig(model: MockLanguageModelV4): MastraModelConfig {
  return model as unknown as MastraModelConfig;
}

export function structuredModel(object: unknown): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doGenerate: async () =>
      ({
        content: [{ type: 'text', text: JSON.stringify(object) }],
        finishReason: { unified: 'stop', raw: undefined },
        usage: USAGE,
        warnings: [],
      }) as never,
  });
}
