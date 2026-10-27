import { TicketsUnavailableError } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { AgentTool } from '../../core/agent-tool.js';
import type { RespondInput } from '../../core/llm-client.js';
import type { LlmEvent } from '../../core/llm-event.js';
import { makeTurnContext } from '../scripted/make-turn-context.js';
import { makeUnderstanding } from '../scripted/make-understanding.js';
import {
  asModelConfig,
  failingStream,
  scriptedModel,
  streamOf,
  structuredModel,
  textChunks,
  toolCallChunks,
} from '../scripted/fake-language-model.js';
import { MastraLlmClient, type MastraTimeouts } from './mastra-llm-client.js';
import { ModelFailureError } from './model-failure.js';

const MAX_STEPS = 6;
const SERVER_ERROR = 503;
const RATE_LIMITED = 429;
const SHORT_TIMEOUTS = { firstEventMs: 50, turnMs: 5000 };

function makeClient(
  model: Parameters<typeof asModelConfig>[0],
  timeouts?: MastraTimeouts,
): MastraLlmClient {
  const config = asModelConfig(model);
  return new MastraLlmClient({ router: config, response: config }, timeouts);
}

function makeEchoTool(execute: AgentTool['execute']): AgentTool {
  return {
    name: 'echo',
    description: 'Repete o texto recebido.',
    stepKind: 'searched_knowledge',
    failureLabel: 'repetiu',
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.unknown(),
    stepLabel: () => 'repetiu',
    stepResult: () => 'ok',
    execute,
  };
}

function makeRequest(tools: AgentTool[] = []): RespondInput {
  const { context } = makeTurnContext();
  const messages = [{ role: 'user' as const, content: 'oi' }];
  return {
    instructions: 'Responda em português.',
    messages,
    tools,
    maxSteps: MAX_STEPS,
    context,
    signal: new AbortController().signal,
  };
}

async function collect(stream: AsyncIterable<LlmEvent>): Promise<LlmEvent[]> {
  const events: LlmEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}

describe('MastraLlmClient.respond', () => {
  it('emite o texto e o uso acumulado depois de executar a tool pedida pelo modelo', async () => {
    const received: unknown[] = [];
    const echo = makeEchoTool(async (input) => {
      received.push(input);
      return { got: input };
    });
    const model = scriptedModel([
      streamOf(toolCallChunks('echo', { text: 'vpn' })),
      streamOf(textChunks('Olá')),
    ]);
    const client = makeClient(model);
    const events = await collect(client.respond(makeRequest([echo])));
    expect(received).toEqual([{ text: 'vpn' }]);
    expect(events).toEqual([
      { type: 'text-delta', delta: 'Olá' },
      { type: 'finished', usage: { inputTokens: 20, outputTokens: 10 } },
    ]);
  });

  it('tenta de novo uma vez quando o erro de servidor vem antes do primeiro texto', async () => {
    const model = scriptedModel([failingStream(SERVER_ERROR), streamOf(textChunks('Olá'))]);
    const client = makeClient(model);
    const events = await collect(client.respond(makeRequest()));
    expect(events[0]).toEqual({ type: 'text-delta', delta: 'Olá' });
    expect(model.doStreamCalls).toHaveLength(2);
  });

  it('não repete quando o erro chega depois do texto', async () => {
    const broken = streamOf([
      ...textChunks('Olá').slice(0, 3),
      { type: 'error', error: Object.assign(new Error('queda'), { statusCode: SERVER_ERROR }) },
    ]);
    const model = scriptedModel([broken, streamOf(textChunks('de novo'))]);
    const client = makeClient(model);
    const events: LlmEvent[] = [];
    const reading = (async () => {
      for await (const event of client.respond(makeRequest())) {
        events.push(event);
      }
    })();
    await expect(reading).rejects.toBeInstanceOf(ModelFailureError);
    expect(events).toEqual([{ type: 'text-delta', delta: 'Olá' }]);
    expect(model.doStreamCalls).toHaveLength(1);
  });

  it('não repete limite de uso do provedor e não repassa a mensagem dele', async () => {
    const model = scriptedModel([failingStream(RATE_LIMITED), streamOf(textChunks('Olá'))]);
    const client = makeClient(model);
    const error = await collect(client.respond(makeRequest())).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ name: 'ModelFailureError', statusCode: RATE_LIMITED });
    expect((error as Error).message).not.toContain('detalhe interno');
    expect(model.doStreamCalls).toHaveLength(1);
  });

  it('tenta de novo quando o primeiro evento não chega no prazo', async () => {
    const hanging = () => new Promise<never>(() => undefined);
    const model = scriptedModel([hanging, streamOf(textChunks('Olá'))]);
    const client = makeClient(model, SHORT_TIMEOUTS);
    const events = await collect(client.respond(makeRequest()));
    expect(events[0]).toEqual({ type: 'text-delta', delta: 'Olá' });
    expect(model.doStreamCalls).toHaveLength(2);
  });

  it('interrompe o turno com o erro da tool quando o legado fica indisponível', async () => {
    const echo = makeEchoTool(async () => {
      throw new TicketsUnavailableError();
    });
    const model = scriptedModel([
      streamOf(toolCallChunks('echo', { text: 'x' })),
      streamOf(textChunks('não deveria chegar')),
    ]);
    const client = makeClient(model);
    const failure = collect(client.respond(makeRequest([echo])));
    await expect(failure).rejects.toBeInstanceOf(TicketsUnavailableError);
    expect(model.doStreamCalls).toHaveLength(1);
  });
});

describe('MastraLlmClient.understand', () => {
  it('devolve o entendimento estruturado com o uso de tokens', async () => {
    const understanding = makeUnderstanding();
    const model = structuredModel(understanding);
    const client = makeClient(model);
    const result = await client.understand({ instructions: 'Classifique.', messages: [] });
    expect(result.value).toEqual(understanding);
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
  });
});
