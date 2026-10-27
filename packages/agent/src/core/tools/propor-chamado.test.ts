import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import type { ScriptedTicketRules } from '../../persistence/scripted/scripted-ticket-rules.js';
import { type ProporChamadoInput, createProporChamadoTool } from './propor-chamado.js';

const OPEN_VPN = makeTicket({ number: 'INC-20298', title: 'VPN caiu', category: 'network_vpn' });

const INPUT: ProporChamadoInput = {
  title: 'VPN com erro 809',
  description: 'A VPN não conecta no Windows 11.',
  type: 'incident',
  category: 'network_vpn',
  affected: 'only_me',
  priorityFacts: {
    impact: 'only_me',
    blocksWork: true,
    sameDayCommitment: false,
    hasWorkaround: false,
    kind: 'incident',
  },
};

function makeTool(rules: ScriptedTicketRules = {}) {
  const tickets = new InMemoryTicketsApi([], rules);
  return createProporChamadoTool({ tickets });
}

const WITH_OPEN_MATCH: ScriptedTicketRules = {
  duplicateCheck: { openMatches: [OPEN_VPN], rule: 'há chamado aberto equivalente' },
};

describe('propor_chamado', () => {
  it('TU-21: bloqueia a proposta quando existe chamado aberto equivalente', async () => {
    const { context, events } = makeTurnContext();
    const output = await makeTool(WITH_OPEN_MATCH).execute(INPUT, context);
    expect(output).toMatchObject({
      status: 'duplicate_found',
      rules: ['há chamado aberto equivalente'],
    });
    expect(output.status === 'duplicate_found' && output.duplicates[0]?.number).toBe('INC-20298');
    expect(events.filter((event) => event.type === 'proposal')).toEqual([]);
  });

  it('propõe o rascunho com a prioridade calculada pelo sistema de chamados', async () => {
    const { context, events } = makeTurnContext();
    const tool = makeTool({ assessment: { priority: 'high', rule: 'bloqueia o trabalho' } });
    const output = await tool.execute(INPUT, context);
    expect(output).toMatchObject({ status: 'proposed', draft: { priority: 'high' } });
    expect(events).toEqual([
      expect.objectContaining({
        type: 'proposal',
        kind: 'create_ticket',
        draft: expect.objectContaining({
          title: INPUT.title,
          priority: 'high',
          rule: 'bloqueia o trabalho',
        }),
        targetNumber: null,
        complement: null,
      }),
    ]);
  });

  it('segue com o override notDuplicateOf e registra a indicação nas regras', async () => {
    const { context, events } = makeTurnContext();
    const output = await makeTool(WITH_OPEN_MATCH).execute(
      { ...INPUT, notDuplicateOf: ['INC-20298'] },
      context,
    );
    expect(output.status).toBe('proposed');
    expect(output.rules).toContain(
      'chamado aberto INC-20298 indicado como não duplicado: segue para abertura',
    );
    expect(events.filter((event) => event.type === 'proposal')).toHaveLength(1);
  });

  it('ignora override de número que não é um chamado aberto equivalente', async () => {
    const { context } = makeTurnContext();
    const output = await makeTool(WITH_OPEN_MATCH).execute(
      { ...INPUT, notDuplicateOf: ['INC-99999'] },
      context,
    );
    expect(output.status).toBe('duplicate_found');
  });

  it('rejeita requesterId e prioridade escolhida pelo modelo', () => {
    const { inputSchema } = makeTool();
    expect(inputSchema.safeParse({ ...INPUT, requesterId: 'x' }).success).toBe(false);
    expect(inputSchema.safeParse({ ...INPUT, priority: 'low' }).success).toBe(false);
  });

  it('descreve o resultado do passo', async () => {
    const { context } = makeTurnContext();
    const duplicate = await makeTool(WITH_OPEN_MATCH).execute(INPUT, context);
    const proposed = await makeTool().execute(INPUT, context);
    const tool = makeTool();
    expect(tool.stepResult(INPUT, duplicate)).toBe('chamado aberto equivalente: INC-20298');
    expect(tool.stepResult(INPUT, proposed)).toBe('rascunho com prioridade média');
  });
});
