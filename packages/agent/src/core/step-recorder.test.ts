import { type TicketsApi, TicketsUnavailableError } from '@nexo/contracts';
import { withResilience } from '@nexo/shared/resilience';
import { describe, expect, it } from 'vitest';
import { FlakyTicketsApi } from '../persistence/scripted/flaky-tickets-api.js';
import { InMemoryKnowledgeApi } from '../persistence/scripted/in-memory-knowledge-api.js';
import { InMemoryTicketsApi } from '../persistence/scripted/in-memory-tickets-api.js';
import { makeArticle, makeTicket } from '../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../persistence/scripted/make-turn-context.js';
import { StepRecorder } from './step-recorder.js';
import { createBuscarCentralTool } from './tools/buscar-central.js';
import { createBuscarChamadosTool } from './tools/buscar-chamados.js';
import { createCitarArtigoTool } from './tools/citar-artigo.js';
import { createConsultarChamadoTool } from './tools/consultar-chamado.js';

const REQUESTER_ID = '0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d';
const FAST_RETRY = { attempts: 3, timeoutMs: 1000, baseDelayMs: 1, backoffFactor: 1 };

type ReadTickets = Pick<TicketsApi, 'listOwn' | 'searchOwn' | 'findOwn'>;

function resilient(api: InMemoryTicketsApi, recorder: StepRecorder): ReadTickets {
  const policy = { ...FAST_RETRY, onAttemptFailed: recorder.onAttemptFailed };
  return {
    listOwn: (input) => withResilience(() => api.listOwn(input), policy),
    searchOwn: (input) => withResilience(() => api.searchOwn(input), policy),
    findOwn: (input) => withResilience(() => api.findOwn(input), policy),
  };
}

describe('StepRecorder', () => {
  it('registra exatamente os passos das tools executadas, na ordem, e emite cada um', async () => {
    const { context, events, clock } = makeTurnContext({ requesterId: REQUESTER_ID });
    const tickets = new InMemoryTicketsApi([{ requesterId: REQUESTER_ID, ticket: makeTicket() }]);
    const knowledge = new InMemoryKnowledgeApi([makeArticle()]);
    const recorder = new StepRecorder();
    const buscarChamados = recorder.wrap(createBuscarChamadosTool({ tickets }));
    const buscarCentral = recorder.wrap(createBuscarCentralTool({ knowledge }));
    const citarArtigo = recorder.wrap(createCitarArtigoTool());
    await buscarChamados.execute({ scope: 'open', query: 'notebook' }, context);
    clock.advance(40);
    await buscarCentral.execute({ query: 'vpn' }, context);
    await citarArtigo.execute(
      { articleId: 'vpn-erro-809', applies: false, reason: 'Windows 10' },
      context,
    );
    expect(recorder.steps.map((step) => [step.id, step.kind, step.status, step.attempts])).toEqual([
      ['s1', 'searched_tickets', 'ok', 1],
      ['s2', 'searched_knowledge', 'ok', 1],
      ['s3', 'cited_article', 'ok', 1],
    ]);
    expect(recorder.steps[0]?.result).toBe('1 chamado encontrado');
    expect(recorder.steps[2]?.result).toBe("artigo 'VPN com erro 809' não se aplica: Windows 10");
    const emitted = events.flatMap((event) => (event.type === 'step' ? [event.step] : []));
    expect(emitted).toEqual(recorder.steps);
  });

  it('mede a duração de cada passo com o relógio do turno', async () => {
    const { context, clock } = makeTurnContext();
    const recorder = new StepRecorder();
    const slowTool = createBuscarCentralTool({
      knowledge: {
        search: async () => {
          clock.advance(120);
          return [];
        },
      },
    });
    await recorder.wrap(slowTool).execute({ query: 'vpn' }, context);
    expect(recorder.steps[0]?.durationMs).toBe(120);
  });

  it('conta as tentativas feitas até o sucesso', async () => {
    const { context } = makeTurnContext({ requesterId: REQUESTER_ID });
    const recorder = new StepRecorder();
    const flaky = new FlakyTicketsApi([{ requesterId: REQUESTER_ID, ticket: makeTicket() }], 2);
    const tool = recorder.wrap(createBuscarChamadosTool({ tickets: resilient(flaky, recorder) }));
    await tool.execute({ scope: 'all' }, context);
    expect(recorder.steps).toHaveLength(1);
    expect(recorder.steps[0]).toMatchObject({ status: 'ok', attempts: 3 });
  });

  it('registra passo com falha e tentativas esgotadas, e repassa o erro', async () => {
    const { context, events } = makeTurnContext({ requesterId: REQUESTER_ID });
    const recorder = new StepRecorder();
    const flaky = new FlakyTicketsApi([], 5);
    const tool = recorder.wrap(createBuscarChamadosTool({ tickets: resilient(flaky, recorder) }));
    await expect(tool.execute({ scope: 'all' }, context)).rejects.toBeInstanceOf(
      TicketsUnavailableError,
    );
    expect(recorder.steps).toEqual([
      {
        id: 's1',
        kind: 'searched_tickets',
        label: 'consultou seus chamados',
        result: 'sistema de chamados indisponível após 3 tentativas',
        status: 'failed',
        attempts: 3,
        durationMs: 0,
      },
    ]);
    expect(events).toContainEqual({ type: 'step', step: recorder.steps[0] });
  });

  it('reinicia a contagem de tentativas a cada tool', async () => {
    const { context } = makeTurnContext({ requesterId: REQUESTER_ID });
    const recorder = new StepRecorder();
    const flaky = new FlakyTicketsApi([], 1);
    const tickets = resilient(flaky, recorder);
    const tool = recorder.wrap(createBuscarChamadosTool({ tickets }));
    await tool.execute({ scope: 'all' }, context);
    await tool.execute({ scope: 'all' }, context);
    expect(recorder.steps.map((step) => step.attempts)).toEqual([2, 1]);
  });

  it('registra como falha o artigo que não veio da busca do turno', async () => {
    const { context } = makeTurnContext();
    const recorder = new StepRecorder();
    const tool = recorder.wrap(createCitarArtigoTool());
    await expect(
      tool.execute({ articleId: 'inventado', applies: true, reason: 'x' }, context),
    ).rejects.toThrow();
    expect(recorder.steps[0]).toMatchObject({
      kind: 'cited_article',
      status: 'failed',
      result: 'artigo fora da busca deste turno',
    });
  });

  it('registra como falha e não executa a tool quando o modelo manda argumentos inválidos', async () => {
    const { context } = makeTurnContext();
    const recorder = new StepRecorder();
    const api = new InMemoryTicketsApi([]);
    const tool = recorder.wrap(createConsultarChamadoTool({ tickets: api }));
    const invalidInput = { number: 'INC-1' };
    await expect(tool.execute(invalidInput, context)).rejects.toThrow();
    expect(recorder.steps[0]).toMatchObject({ status: 'failed', result: 'argumentos inválidos' });
  });

  it('não vaza detalhes de erros inesperados no resultado do passo', async () => {
    const { context } = makeTurnContext();
    const recorder = new StepRecorder();
    const knowledge = {
      search: async () => {
        throw new Error('connection refused postgres://secret@host');
      },
    };
    const tool = recorder.wrap(createBuscarCentralTool({ knowledge }));
    await expect(tool.execute({ query: 'vpn' }, context)).rejects.toThrow();
    expect(recorder.steps[0]?.result).toBe('não foi possível concluir este passo');
  });
});
