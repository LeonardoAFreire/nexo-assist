import type { AgentTurnEvent } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../persistence/scripted/in-memory-tickets-api.js';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import type { ScriptedEntry } from '../persistence/scripted/scripted-llm-client.js';

const IMPACT_LABELS = ['Só eu', 'Minha equipe', 'Toda a empresa', 'Não sei'];
const ASKED_IN_TEXT = 'Quem está afetado: só você mesmo?';
const NO_IMPACT = {
  ticketNumber: null,
  operatingSystem: 'Windows 11',
  symptom: 'erro 809',
  impact: null,
  sameDayCommitment: null,
  hasWorkaround: null,
  blocksWork: null,
};

function understandOpening(impact: 'only_me' | 'unknown' | null = null): ScriptedEntry {
  const entities = { ...NO_IMPACT, impact };
  return {
    type: 'understand',
    understanding: makeUnderstanding({ intent: 'ticket_open', entities }),
  };
}

function partsOf(events: AgentTurnEvent[]) {
  return events.flatMap((event) => (event.type === 'part' ? [event.part] : []));
}

function optionLabelsOf(events: AgentTurnEvent[]): string[][] {
  return partsOf(events).flatMap((part) =>
    part.type === 'quick_options' ? [part.options.map((option) => option.label)] : [],
  );
}

describe('pergunta de impacto garantida pelo código', () => {
  it('CA-10: oferece as opções de impacto quando o modelo pergunta só em texto', async () => {
    const { collect } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([]),
      script: [understandOpening(), { type: 'respond', text: ASKED_IN_TEXT, toolCalls: [] }],
    });
    const events = await collect();
    expect(optionLabelsOf(events)).toEqual([IMPACT_LABELS]);
    const completed = events.find((event) => event.type === 'completed');
    expect(completed?.type === 'completed' && completed.steps.map((step) => step.kind)).toEqual([
      'asked_question',
    ]);
  });

  it('não repete a pergunta quando o modelo já usou as opções rápidas', async () => {
    const asked = { question: 'Quem está sendo afetado?', options: ['Só eu', 'Minha equipe'] };
    const { collect } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([]),
      script: [
        understandOpening(),
        { type: 'respond', text: '', toolCalls: [{ name: 'perguntar_opcoes', input: asked }] },
      ],
    });
    expect(optionLabelsOf(await collect())).toHaveLength(1);
  });

  it('trata "não informado" devolvido pelo entendimento como impacto ainda não dito', async () => {
    const { collect } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([]),
      script: [
        understandOpening('unknown'),
        { type: 'respond', text: ASKED_IN_TEXT, toolCalls: [] },
      ],
    });
    expect(optionLabelsOf(await collect())).toEqual([IMPACT_LABELS]);
  });

  it('não repete a pergunta depois que ela já foi feita, mesmo com "Não sei"', async () => {
    const asked = {
      author: 'agent' as const,
      authorLabel: 'Nexo Assist',
      text: '',
      parts: [
        {
          type: 'quick_options' as const,
          question: 'Quem está sendo afetado por esse problema?',
          options: [{ id: 'unknown', label: 'Não sei' }],
          answered: true,
        },
      ],
    };
    const { collect } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([]),
      script: [
        understandOpening('unknown'),
        { type: 'respond', text: 'Sem problema.', toolCalls: [] },
      ],
    });
    expect(optionLabelsOf(await collect({ history: [asked] }))).toEqual([]);
  });

  it('não pergunta quando o funcionário já disse quem é afetado', async () => {
    const { collect } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([]),
      script: [understandOpening('only_me'), { type: 'respond', text: 'Entendi.', toolCalls: [] }],
    });
    expect(optionLabelsOf(await collect())).toEqual([]);
  });

  it('não pergunta em dúvida resolvida pela central de ajuda', async () => {
    const question = makeUnderstanding({ intent: 'question' });
    const { collect } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([]),
      script: [
        { type: 'understand', understanding: question },
        { type: 'respond', text: 'O horário é das 8h às 18h.', toolCalls: [] },
      ],
    });
    expect(optionLabelsOf(await collect())).toEqual([]);
  });
});
