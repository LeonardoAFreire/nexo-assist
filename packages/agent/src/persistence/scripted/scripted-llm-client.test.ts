import type { Understanding } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { StepRecorder } from '../../core/step-recorder.js';
import { createBuscarCentralTool } from '../../core/tools/buscar-central.js';
import { InMemoryKnowledgeApi } from './in-memory-knowledge-api.js';
import { makeArticle } from './make-ticket.js';
import { makeTurnContext } from './make-turn-context.js';
import { ScriptedLlmClient, UnscriptedLlmCallError } from './scripted-llm-client.js';

const understanding: Understanding = {
  intent: 'ticket_open',
  summary: 'VPN com erro 809',
  entities: {
    ticketNumber: null,
    operatingSystem: 'Windows 11',
    symptom: 'erro 809 na VPN',
    impact: 'only_me',
    sameDayCommitment: null,
    hasWorkaround: null,
    blocksWork: true,
  },
  confidence: 0.9,
  reason: 'relata falha',
};

function respondInput(tools: ReturnType<typeof createBuscarCentralTool>[]) {
  const { context, events } = makeTurnContext();
  const input = {
    instructions: '',
    messages: [],
    tools,
    maxSteps: 6,
    requireToolFirst: false,
    context,
    signal: new AbortController().signal,
  };
  return { input, events };
}

async function collect(client: ScriptedLlmClient, input: ReturnType<typeof respondInput>['input']) {
  const events = [];
  for await (const event of client.respond(input)) {
    events.push(event);
  }
  return events;
}

describe('ScriptedLlmClient', () => {
  it('entrega o entendimento roteirizado', async () => {
    const client = new ScriptedLlmClient([{ type: 'understand', understanding }]);
    const result = await client.understand();
    expect(result.value).toEqual(understanding);
    expect(client.remaining).toBe(0);
  });

  it('falha diante de chamada que o roteiro não previu', async () => {
    const client = new ScriptedLlmClient([]);
    await expect(client.understand()).rejects.toBeInstanceOf(UnscriptedLlmCallError);
    await expect(collect(client, respondInput([]).input)).rejects.toBeInstanceOf(
      UnscriptedLlmCallError,
    );
  });

  it('falha quando o roteiro previa outro tipo de chamada', async () => {
    const client = new ScriptedLlmClient([{ type: 'respond', text: 'Olá' }]);
    await expect(client.understand()).rejects.toBeInstanceOf(UnscriptedLlmCallError);
  });

  it('executa as tools roteirizadas e transmite o texto em trechos', async () => {
    const recorder = new StepRecorder();
    const knowledge = new InMemoryKnowledgeApi([makeArticle()]);
    const tool = recorder.wrap(createBuscarCentralTool({ knowledge }));
    const client = new ScriptedLlmClient([
      {
        type: 'respond',
        text: 'Encontrei um artigo',
        toolCalls: [{ name: 'buscar_central', input: { query: 'vpn' } }],
        usage: { inputTokens: 10, outputTokens: 4 },
      },
    ]);
    const { input } = respondInput([tool]);
    const events = await collect(client, input);
    expect(recorder.steps.map((step) => step.kind)).toEqual(['searched_knowledge']);
    expect(events.filter((event) => event.type === 'text-delta')).toHaveLength(3);
    expect(events.at(-1)).toEqual({
      type: 'finished',
      usage: { inputTokens: 10, outputTokens: 4 },
    });
  });

  it('falha quando o roteiro chama uma tool não oferecida no turno', async () => {
    const client = new ScriptedLlmClient([
      { type: 'respond', text: '', toolCalls: [{ name: 'buscar_central', input: {} }] },
    ]);
    await expect(collect(client, respondInput([]).input)).rejects.toBeInstanceOf(
      UnscriptedLlmCallError,
    );
  });
});
