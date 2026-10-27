import type { AgentTurnEvent } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { InMemoryAgentRunRepository } from '../persistence/scripted/in-memory-agent-run-repository.js';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import type { ScriptedEntry } from '../persistence/scripted/scripted-llm-client.js';
import type { AgentRun } from './agent-run.js';
import { CONVERSATION_TOKEN_BUDGET } from './budget-guard.js';

const CONVERSATION_ID = '4f0a1c9e-3d6b-4a52-9b8e-7c1d2e3f4a5b';
const OTHER_CONVERSATION_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const USAGE = { inputTokens: 1000, outputTokens: 200 };

function ofType<T extends AgentTurnEvent['type']>(events: AgentTurnEvent[], type: T) {
  return events.filter(
    (event): event is Extract<AgentTurnEvent, { type: T }> => event.type === type,
  );
}

function understand(overrides: Parameters<typeof makeUnderstanding>[0] = {}): ScriptedEntry {
  return { type: 'understand', understanding: makeUnderstanding(overrides), usage: USAGE };
}

function makePastRun(overrides: Partial<AgentRun>): AgentRun {
  return {
    id: 'run-anterior',
    conversationId: CONVERSATION_ID,
    intent: 'question',
    confidence: 0.9,
    action: 'replied',
    handoffReason: null,
    steps: [],
    models: [],
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    firstTokenMs: null,
    durationMs: 100,
    outcome: 'answered',
    createdAt: '2026-10-26T12:00:00.000Z',
    ...overrides,
  };
}

describe('AgentService', () => {
  it('TU-16: transfere sem chamar o laço quando o funcionário pede analista', async () => {
    const { collect, llm } = makeAgentHarness({
      script: [understand({ intent: 'analyst_request', confidence: 0.95 })],
    });
    const events = await collect();
    expect(ofType(events, 'failed')).toEqual([]);
    expect(ofType(events, 'handoff-requested')).toMatchObject([
      { reason: 'requested', confidence: 0.95 },
    ]);
    const [completed] = ofType(events, 'completed');
    expect(completed?.decision.action.kind).toBe('handed_off');
    expect(completed?.steps.map((step) => step.kind)).toEqual(['handed_off']);
    expect(llm.remaining).toBe(0);
  });

  it('TU-17: transfere com motivo de baixa confiança abaixo do limite', async () => {
    const { collect, runs } = makeAgentHarness({ script: [understand({ confidence: 0.41 })] });
    const events = await collect();
    const [handoff] = ofType(events, 'handoff-requested');
    expect(handoff).toMatchObject({ reason: 'low_confidence', confidence: 0.41 });
    expect(handoff?.summary).toContain('41%');
    expect(runs.saved[0]).toMatchObject({ outcome: 'handed_off', handoffReason: 'low_confidence' });
  });

  it('TU-23: encerra o laço no limite de passos com resposta tratada', async () => {
    const lookup = { name: 'buscar_chamados', input: { scope: 'all' } };
    const { collect, llm } = makeAgentHarness({
      script: [
        understand(),
        { type: 'respond', text: 'Consultando', toolCalls: Array(7).fill(lookup) },
      ],
    });
    const events = await collect();
    const [completed] = ofType(events, 'completed');
    expect(completed?.steps).toHaveLength(6);
    expect(completed?.decision.action.kind).toBe('degraded');
    expect(ofType(events, 'failed')).toEqual([]);
    expect(llm.remaining).toBe(0);
    const [options] = ofType(events, 'part');
    expect(options?.part).toMatchObject({
      type: 'quick_options',
      options: [{ label: 'Tentar de novo' }, { label: 'Falar com um analista' }],
    });
  });

  it('TU-24: não chama o modelo quando o teto diário de custo foi atingido', async () => {
    const spent = makePastRun({ conversationId: OTHER_CONVERSATION_ID, costUsd: 2 });
    const runs = new InMemoryAgentRunRepository([spent]);
    const { collect, llm } = makeAgentHarness({ script: [understand()], runs });
    const events = await collect();
    expect(events).toEqual([{ type: 'failed', code: 'budget_exhausted', retryable: false }]);
    expect(llm.remaining).toBe(1);
    expect(runs.saved).toEqual([]);
  });

  it('não chama o modelo e oferece alternativas quando a conversa estourou os tokens', async () => {
    const spent = makePastRun({ inputTokens: CONVERSATION_TOKEN_BUDGET });
    const runs = new InMemoryAgentRunRepository([spent]);
    const { collect, llm } = makeAgentHarness({ script: [understand()], runs });
    const events = await collect();
    const [completed] = ofType(events, 'completed');
    expect(completed?.decision.action.kind).toBe('degraded');
    expect(ofType(events, 'part')).toHaveLength(1);
    expect(llm.remaining).toBe(1);
    expect(runs.saved[0]?.outcome).toBe('degraded');
  });

  it('responde com falha recuperável quando o modelo não responde', async () => {
    const { collect } = makeAgentHarness({ script: [] });
    expect(await collect()).toEqual([
      { type: 'failed', code: 'agent_unavailable', retryable: true },
    ]);
  });

  it('transmite o texto, grava o registro do turno e devolve o mesmo runId', async () => {
    const { collect, runs } = makeAgentHarness({
      script: [understand(), { type: 'respond', text: 'Reinicie o cliente.', usage: USAGE }],
    });
    const events = await collect();
    const deltas = ofType(events, 'text-delta').map((event) => event.delta);
    const [completed] = ofType(events, 'completed');
    expect(completed?.text).toBe(deltas.join(''));
    expect(completed?.text).toBe('Reinicie o cliente.');
    expect(events.at(-1)).toBe(completed);
    expect(runs.saved).toHaveLength(1);
    expect(runs.saved[0]).toMatchObject({
      id: completed?.runId,
      intent: 'question',
      outcome: 'answered',
      inputTokens: 2000,
      outputTokens: 400,
      models: ['router-model', 'response-model'],
    });
    expect(runs.saved[0]?.costUsd).toBeGreaterThan(0);
  });
});
