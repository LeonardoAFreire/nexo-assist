import { TicketNotFoundError, TicketsUnavailableError } from '@nexo/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { AgentLogger } from '../../core/agent-logger.js';
import { StepRecorder } from '../../core/step-recorder.js';
import { createBuscarChamadosTool } from '../../core/tools/buscar-chamados.js';
import { FlakyTicketsApi } from '../scripted/flaky-tickets-api.js';
import { makeTicket } from '../scripted/make-ticket.js';
import { makeTurnContext } from '../scripted/make-turn-context.js';
import { ResilientKnowledgeApi } from './resilient-knowledge-api.js';
import { ResilientTicketsApi } from './resilient-tickets-api.js';

const REQUESTER_ID = '0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d';
const FAST_POLICY = { attempts: 3, timeoutMs: 1000, baseDelayMs: 1, backoffFactor: 1 };
const THREE_ATTEMPTS = 3;

function makeLogger() {
  const warn = vi.fn<AgentLogger['warn']>();
  const logger: AgentLogger = { info: vi.fn(), warn };
  return { logger, warn };
}

function makeFlaky(failures: number): FlakyTicketsApi {
  return new FlakyTicketsApi([{ requesterId: REQUESTER_ID, ticket: makeTicket() }], failures);
}

describe('ResilientTicketsApi', () => {
  it('registra as novas tentativas no passo e entrega o resultado quando o legado volta', async () => {
    const { logger, warn } = makeLogger();
    const tickets = new ResilientTicketsApi(makeFlaky(2), { logger, policy: FAST_POLICY });
    const recorder = new StepRecorder();
    const tool = recorder.wrap(createBuscarChamadosTool({ tickets }));
    const { context } = makeTurnContext({ requesterId: REQUESTER_ID });
    const output = await tool.execute({ scope: 'all' }, context);
    expect(output.tickets).toHaveLength(1);
    expect(recorder.steps[0]).toMatchObject({ status: 'ok', attempts: THREE_ATTEMPTS });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('propaga TicketsUnavailableError após 3 falhas e registra as tentativas', async () => {
    const tickets = new ResilientTicketsApi(makeFlaky(10), { policy: FAST_POLICY });
    const recorder = new StepRecorder();
    const tool = recorder.wrap(createBuscarChamadosTool({ tickets }));
    const { context } = makeTurnContext({ requesterId: REQUESTER_ID });
    await expect(tool.execute({ scope: 'all' }, context)).rejects.toBeInstanceOf(
      TicketsUnavailableError,
    );
    expect(recorder.steps[0]).toMatchObject({
      status: 'failed',
      attempts: THREE_ATTEMPTS,
      result: 'sistema de chamados indisponível após 3 tentativas',
    });
  });

  it('não repete erro que não é indisponibilidade', async () => {
    const inner = makeFlaky(0);
    const failure = vi.spyOn(inner, 'findOwn').mockRejectedValue(new TicketNotFoundError());
    const tickets = new ResilientTicketsApi(inner, { policy: FAST_POLICY });
    await expect(tickets.findOwn({ requesterId: REQUESTER_ID, number: 'INC-1' })).rejects.toThrow(
      TicketNotFoundError,
    );
    expect(failure).toHaveBeenCalledTimes(1);
  });
});

describe('ResilientKnowledgeApi', () => {
  it('repete a busca e devolve o resultado quando a segunda tentativa funciona', async () => {
    const search = vi.fn().mockRejectedValueOnce(new Error('banco fora')).mockResolvedValueOnce([]);
    const knowledge = new ResilientKnowledgeApi({ search, get: vi.fn() }, { policy: FAST_POLICY });
    await expect(knowledge.search({ query: 'vpn', limit: 3 })).resolves.toEqual([]);
    expect(search).toHaveBeenCalledTimes(2);
  });
});
