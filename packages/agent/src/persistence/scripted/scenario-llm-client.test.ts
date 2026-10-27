import { describe, expect, it } from 'vitest';
import type { AgentTool } from '../../core/agent-tool.js';
import type { RespondInput } from '../../core/llm-client.js';
import { StepRecorder } from '../../core/step-recorder.js';
import { createBuscarCentralTool } from '../../core/tools/buscar-central.js';
import { createConsultarChamadoTool } from '../../core/tools/consultar-chamado.js';
import { createMostrarChamadoTool } from '../../core/tools/mostrar-chamado.js';
import { InMemoryKnowledgeApi } from './in-memory-knowledge-api.js';
import { InMemoryTicketsApi } from './in-memory-tickets-api.js';
import { makeArticle, makeTicket } from './make-ticket.js';
import { makeTurnContext } from './make-turn-context.js';
import { ScenarioLlmClient } from './scenario-llm-client.js';
import { SCENARIOS } from './scenarios.js';
import { UnscriptedLlmCallError } from './scripted-llm-client.js';

const OWNER_ID = 'a1111111-1111-4111-8111-111111111111';
const OTHER_ID = 'b2222222-2222-4222-8222-222222222222';
const client = new ScenarioLlmClient(SCENARIOS);

function wrapped(text: string) {
  return [
    {
      role: 'user' as const,
      content: `<contexto>\nFuncionário: Ana\n</contexto>\n<mensagem_do_funcionario>${text}</mensagem_do_funcionario>`,
    },
  ];
}

function toolsFor(requesterTickets: ReturnType<typeof makeTicket>[]): AgentTool[] {
  const recorder = new StepRecorder();
  const owned = requesterTickets.map((ticket) => ({ requesterId: OWNER_ID, ticket }));
  const tickets = new InMemoryTicketsApi(owned);
  const knowledge = new InMemoryKnowledgeApi([makeArticle()]);
  return [
    createBuscarCentralTool({ knowledge }),
    createConsultarChamadoTool({ tickets }),
    createMostrarChamadoTool({ tickets }),
  ].map((tool) => recorder.wrap(tool as AgentTool)) as AgentTool[];
}

async function replyTo(text: string, options: { requesterId: string; tickets: AgentTool[] }) {
  const { context, events } = makeTurnContext({ requesterId: options.requesterId });
  const input: RespondInput = {
    instructions: '',
    messages: wrapped(text),
    tools: options.tickets,
    maxSteps: 6,
    finishingTools: [],
    context,
    signal: new AbortController().signal,
  };
  let reply = '';
  for await (const event of client.respond(input)) {
    reply += event.type === 'text-delta' ? event.delta : '';
  }
  return { reply, events };
}

describe('ScenarioLlmClient', () => {
  it('escolhe o cenário pela última mensagem do funcionário', async () => {
    const result = await client.understand({
      instructions: '',
      messages: wrapped('Quero falar com um analista'),
    });
    expect(result.value.intent).toBe('analyst_request');
  });

  it('falha diante de mensagem que nenhum cenário atende', async () => {
    await expect(
      client.understand({ instructions: '', messages: wrapped('Bom dia') }),
    ).rejects.toBeInstanceOf(UnscriptedLlmCallError);
  });

  it('responde igual para chamado de terceiro e chamado inexistente', async () => {
    const tickets = toolsFor([makeTicket({ number: 'INC-20517', title: 'VPN da filial' })]);
    const third = await replyTo('Status do INC-20517', { requesterId: OTHER_ID, tickets });
    const missing = await replyTo('Status do INC-99999', { requesterId: OTHER_ID, tickets });
    expect(third.reply.replace('INC-20517', 'N')).toBe(missing.reply.replace('INC-99999', 'N'));
    expect(third.reply).not.toContain('VPN da filial');
    expect(third.events.filter((event) => event.type === 'part')).toEqual([]);
  });

  it('mostra o cartão quando o chamado pertence ao funcionário da sessão', async () => {
    const tickets = toolsFor([makeTicket({ number: 'INC-20311' })]);
    const own = await replyTo('Status do INC-20311', { requesterId: OWNER_ID, tickets });
    expect(own.reply).toContain('INC-20311');
    expect(own.events.filter((event) => event.type === 'part')).toHaveLength(1);
  });
});
