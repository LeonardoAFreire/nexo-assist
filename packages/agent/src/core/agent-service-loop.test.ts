import type { AgentTurnEvent } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { FlakyTicketsApi } from '../persistence/scripted/flaky-tickets-api.js';
import { InMemoryTicketsApi } from '../persistence/scripted/in-memory-tickets-api.js';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import { makeTicket } from '../persistence/scripted/make-ticket.js';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import {
  type ScriptedEntry,
  ScriptedLlmClient,
} from '../persistence/scripted/scripted-llm-client.js';
import type { RespondInput } from './llm-client.js';

const REQUESTER_ID = '0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d';

function understand(overrides: Parameters<typeof makeUnderstanding>[0] = {}): ScriptedEntry {
  return { type: 'understand', understanding: makeUnderstanding(overrides) };
}

function completedOf(events: AgentTurnEvent[]) {
  const completed = events.find((event) => event.type === 'completed');
  if (completed?.type !== 'completed') {
    throw new Error('O turno não terminou com o evento completed.');
  }
  return completed;
}

function partsOf(events: AgentTurnEvent[]) {
  return events.flatMap((event) => (event.type === 'part' ? [event.part] : []));
}

class RecordingLlm extends ScriptedLlmClient {
  readonly offered: string[][] = [];

  override respond(input: RespondInput) {
    this.offered.push(input.tools.map((tool) => tool.name));
    return super.respond(input);
  }
}

const PROPOSE_CRITICAL = {
  name: 'propor_chamado',
  input: {
    title: 'Servidor de arquivos fora do ar',
    description: 'Ninguém da área acessa o servidor de arquivos.',
    type: 'incident',
    category: 'network_vpn',
    affected: 'whole_company',
    priorityFacts: {
      impact: 'whole_company',
      blocksWork: true,
      sameDayCommitment: true,
      hasWorkaround: false,
      kind: 'incident',
    },
  },
};

describe('AgentService, laço de resposta', () => {
  it('TU-18: redireciona assunto fora de TI sem oferecer tools de chamados', async () => {
    const llm = new RecordingLlm([
      understand({ intent: 'out_of_scope' }),
      { type: 'respond', text: 'Só atendo assuntos de TI.' },
    ]);
    const { collect } = makeAgentHarness({ script: [], llm });
    const completed = completedOf(await collect());
    expect(llm.offered).toEqual([[]]);
    expect(completed.text).toBe('Só atendo assuntos de TI.');
  });

  it('oferece as tools ao modelo na rota de resposta, sem requesterId nos argumentos', async () => {
    const llm = new RecordingLlm([understand(), { type: 'respond', text: 'Pronto.' }]);
    const { collect } = makeAgentHarness({ script: [], llm });
    await collect();
    expect(llm.offered[0]).toContain('propor_chamado');
    expect(llm.offered[0]).toContain('buscar_chamados');
  });

  it('devolve ao modelo o erro de uma tool e segue o turno sem degradar', async () => {
    const citation = { articleId: 'x', applies: true, reason: 'serve' };
    const { collect } = makeAgentHarness({
      script: [
        understand(),
        {
          type: 'respond',
          text: 'Não achei esse artigo.',
          toolCalls: [{ name: 'citar_artigo', input: citation }],
        },
      ],
    });
    const completed = completedOf(await collect());
    expect(completed.steps[0]?.status).toBe('failed');
    expect(completed.decision.action.kind).not.toBe('degraded');
    expect(completed.text).toBe('Não achei esse artigo.');
  });

  it('rejeita requesterId escolhido pelo modelo e devolve o erro de validação ao modelo', async () => {
    const injected = { scope: 'all', requesterId: 'outro-funcionario' };
    const { collect } = makeAgentHarness({
      script: [
        understand({ intent: 'ticket_status' }),
        {
          type: 'respond',
          text: 'Não consegui consultar.',
          toolCalls: [{ name: 'buscar_chamados', input: injected }],
        },
      ],
    });
    const completed = completedOf(await collect());
    expect(completed.steps).toMatchObject([{ status: 'failed', result: 'argumentos inválidos' }]);
    expect(completed.decision.action.kind).not.toBe('degraded');
  });

  it('degrada o turno quando o sistema de chamados fica indisponível', async () => {
    const { collect } = makeAgentHarness({
      tickets: new FlakyTicketsApi([], 1),
      script: [
        understand({ intent: 'ticket_status' }),
        {
          type: 'respond',
          text: '',
          toolCalls: [{ name: 'buscar_chamados', input: { scope: 'open' } }],
        },
      ],
    });
    const events = await collect();
    const completed = completedOf(events);
    expect(completed.decision.action.kind).toBe('degraded');
    expect(completed.steps[0]?.status).toBe('failed');
    expect(events.some((event) => event.type === 'failed')).toBe(false);
  });

  it('RF20: oferece as opções fixas quando mostra um chamado vencido', async () => {
    const overdue = makeTicket({ number: 'INC-20311', overdue: true });
    const { collect } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([{ requesterId: REQUESTER_ID, ticket: overdue }]),
      script: [
        understand({ intent: 'ticket_status' }),
        {
          type: 'respond',
          text: 'Seu chamado está vencido.',
          toolCalls: [{ name: 'mostrar_chamado', input: { number: 'INC-20311' } }],
        },
      ],
    });
    const options = partsOf(await collect()).find((part) => part.type === 'quick_options');
    const labels = options?.type === 'quick_options' ? options.options.map((o) => o.label) : [];
    expect(labels).toEqual(['Falar com um analista', 'Adicionar informação', 'Não, obrigado']);
  });

  it('RF25: transfere no mesmo turno quando o rascunho tem prioridade crítica', async () => {
    const { collect, runs } = makeAgentHarness({
      tickets: new InMemoryTicketsApi([], { assessment: { priority: 'critical' } }),
      script: [
        understand({ intent: 'ticket_open' }),
        { type: 'respond', text: 'Montei o rascunho.', toolCalls: [PROPOSE_CRITICAL] },
      ],
    });
    const events = await collect();
    const kinds = events.map((event) => event.type);
    expect(kinds.indexOf('proposal')).toBeLessThan(kinds.indexOf('handoff-requested'));
    const handoff = events.find((event) => event.type === 'handoff-requested');
    expect(handoff).toMatchObject({ reason: 'critical', confidence: 0.9 });
    expect(completedOf(events).steps.map((step) => step.kind)).toEqual([
      'built_draft',
      'handed_off',
    ]);
    expect(runs.saved[0]).toMatchObject({ outcome: 'handed_off', handoffReason: 'critical' });
  });
});
