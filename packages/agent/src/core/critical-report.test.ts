import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../persistence/scripted/in-memory-tickets-api.js';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import type { ScriptedEntry } from '../persistence/scripted/scripted-llm-client.js';
import { isCriticalReport } from './critical-report.js';

const ENTITIES = {
  ticketNumber: null,
  operatingSystem: null,
  symptom: 'servidor de arquivos fora do ar',
  impact: null,
  sameDayCommitment: null,
  hasWorkaround: null,
  blocksWork: null,
};
const ASK = {
  name: 'perguntar_opcoes',
  input: { question: 'Há alternativa?', options: ['Sim', 'Não'] },
};
const PROPOSE_CRITICAL = {
  name: 'propor_chamado',
  input: {
    title: 'Servidor de arquivos fora do ar',
    description: 'A equipe inteira está parada.',
    type: 'incident',
    category: 'network_vpn',
    affected: 'my_team',
    priorityFacts: {
      impact: 'my_team',
      blocksWork: true,
      sameDayCommitment: false,
      hasWorkaround: false,
      kind: 'incident',
    },
  },
};

function understand(impact: 'my_team' | 'only_me', blocksWork: boolean): ScriptedEntry {
  const entities = { ...ENTITIES, impact, blocksWork };
  return {
    type: 'understand',
    understanding: makeUnderstanding({ intent: 'ticket_open', entities }),
  };
}

async function run(entry: ScriptedEntry) {
  const respond: ScriptedEntry = {
    type: 'respond',
    text: '',
    toolCalls: [ASK, PROPOSE_CRITICAL],
  };
  const { collect } = makeAgentHarness({
    tickets: new InMemoryTicketsApi([], { assessment: { priority: 'critical' } }),
    script: [entry, respond],
  });
  return collect();
}

describe('relato crítico: o código não deixa o modelo perguntar de novo', () => {
  it('reconhece equipe ou empresa afetada com impedimento de trabalho', () => {
    const critical = makeUnderstanding({
      intent: 'ticket_open',
      entities: { ...ENTITIES, impact: 'my_team', blocksWork: true },
    });
    const personal = makeUnderstanding({
      intent: 'ticket_open',
      entities: { ...ENTITIES, impact: 'only_me', blocksWork: true },
    });
    expect(isCriticalReport(critical)).toBe(true);
    expect(isCriticalReport(personal)).toBe(false);
  });

  it('CA-18: recusa a pergunta, propõe o chamado crítico e transfere', async () => {
    const events = await run(understand('my_team', true));
    const parts = events.flatMap((event) => (event.type === 'part' ? [event.part.type] : []));
    expect(parts).not.toContain('quick_options');
    expect(events.some((event) => event.type === 'proposal')).toBe(true);
    expect(events.find((event) => event.type === 'handoff-requested')).toMatchObject({
      reason: 'critical',
    });
  });

  it('mantém a pergunta quando o impacto é só da pessoa', async () => {
    const events = await run(understand('only_me', true));
    const parts = events.flatMap((event) => (event.type === 'part' ? [event.part.type] : []));
    expect(parts).toContain('quick_options');
  });
});
