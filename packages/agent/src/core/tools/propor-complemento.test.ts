import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createProporComplementoTool } from './propor-complemento.js';

const ANA_ID = '11111111-1111-4111-8111-111111111111';
const BRUNO_ID = '22222222-2222-4222-8222-222222222222';

function makeTool() {
  const tickets = new InMemoryTicketsApi([
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20311' }) },
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20150', status: 'resolved' }) },
    { requesterId: BRUNO_ID, ticket: makeTicket({ number: 'INC-20999' }) },
  ]);
  return createProporComplementoTool({ tickets });
}

async function run(number: string) {
  const { context, events } = makeTurnContext({ requesterId: ANA_ID });
  const output = await makeTool().execute({ number, complement: 'também falha no Excel' }, context);
  return { output, events };
}

describe('propor_complemento', () => {
  it('propõe o complemento de um chamado aberto do funcionário', async () => {
    const { output, events } = await run('INC-20311');
    expect(output).toEqual({ status: 'proposed', number: 'INC-20311' });
    expect(events).toEqual([
      {
        type: 'proposal',
        kind: 'complement_ticket',
        draft: null,
        targetNumber: 'INC-20311',
        complement: 'também falha no Excel',
      },
    ]);
  });

  it('exige chamado aberto e não emite proposta para chamado resolvido', async () => {
    const { output, events } = await run('INC-20150');
    expect(output).toMatchObject({ status: 'ticket_closed' });
    expect(events).toEqual([]);
  });

  it('trata chamado de outro funcionário como inexistente', async () => {
    const foreign = await run('INC-20999');
    const missing = await run('INC-00001');
    expect(foreign.output).toEqual({ status: 'not_found' });
    expect(foreign.output).toEqual(missing.output);
    expect(foreign.events).toEqual([]);
  });

  it('descreve o resultado e expõe a regra de chamado resolvido', async () => {
    const tool = makeTool();
    const input = { number: 'INC-20150', complement: 'x' };
    const closed = (await run('INC-20150')).output;
    const proposed = (await run('INC-20311')).output;
    expect(tool.stepLabel(input, closed)).toBe('preparou o complemento do INC-20150');
    expect(tool.stepResult(input, proposed)).toBe('complemento pronto para confirmação');
    expect(tool.stepResult(input, { status: 'not_found' })).toBe('chamado não encontrado');
    expect(tool.rules?.(input, closed)).toHaveLength(1);
    expect(tool.rules?.(input, proposed)).toEqual([]);
    expect(tool.stepResult(input, closed)).toBe(tool.rules?.(input, closed)[0]);
  });
});
