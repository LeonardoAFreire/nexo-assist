import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createMostrarChamadoTool } from './mostrar-chamado.js';

const ANA_ID = '11111111-1111-4111-8111-111111111111';
const BRUNO_ID = '22222222-2222-4222-8222-222222222222';

function makeTool() {
  const tickets = new InMemoryTicketsApi([
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20311', overdue: true }) },
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20150' }) },
    { requesterId: BRUNO_ID, ticket: makeTicket({ number: 'INC-20999' }) },
  ]);
  return createMostrarChamadoTool({ tickets });
}

describe('mostrar_chamado', () => {
  it('emite o cartão do chamado do funcionário e informa o vencimento', async () => {
    const { context, events } = makeTurnContext({ requesterId: ANA_ID });
    const output = await makeTool().execute({ number: 'INC-20311' }, context);
    expect(output).toEqual({ status: 'shown', overdue: true });
    expect(events[0]).toMatchObject({
      type: 'part',
      part: { type: 'ticket_card', ticket: { number: 'INC-20311' } },
    });
  });

  it('não emite cartão e devolve not_found para chamado alheio ou inexistente', async () => {
    const { context, events } = makeTurnContext({ requesterId: ANA_ID });
    const tool = makeTool();
    const foreign = await tool.execute({ number: 'INC-20999' }, context);
    const missing = await tool.execute({ number: 'INC-00001' }, context);
    expect(foreign).toEqual({ status: 'not_found' });
    expect(missing).toEqual(foreign);
    expect(events).toEqual([]);
  });

  it('rotula o passo como consulta do SLA só quando o chamado está vencido', () => {
    const tool = makeTool();
    const input = { number: 'INC-20311' };
    expect(tool.stepLabel(input, { status: 'shown', overdue: true })).toBe(
      'consultou o SLA do INC-20311',
    );
    expect(tool.stepLabel(input, { status: 'shown', overdue: false })).toBe('mostrou o INC-20311');
    expect(tool.stepResult(input, { status: 'shown', overdue: true })).toBe('chamado vencido');
    expect(tool.stepResult(input, { status: 'shown', overdue: false })).toBe('chamado exibido');
    expect(tool.stepResult(input, { status: 'not_found' })).toBe('chamado não encontrado');
  });

  it('não diz que mostrou um chamado que não encontrou entre os do funcionário', () => {
    const tool = makeTool();
    const input = { number: 'INC-20517' };
    expect(tool.stepLabel(input, { status: 'not_found' })).toBe('procurou o INC-20517');
  });

  it('registra a regra de prazo vencido só quando o chamado está vencido', () => {
    const tool = makeTool();
    const input = { number: 'INC-20311' };
    expect(tool.rules?.(input, { status: 'shown', overdue: true })).toEqual([
      'chamado vencido: o prazo passou, então o agent oferece falar com um analista',
    ]);
    expect(tool.rules?.(input, { status: 'shown', overdue: false })).toEqual([]);
    expect(tool.rules?.(input, { status: 'not_found' })).toEqual([]);
  });

  it('rejeita argumentos extras', () => {
    const { inputSchema } = makeTool();
    expect(inputSchema.safeParse({ number: 'INC-20311', requesterId: BRUNO_ID }).success).toBe(
      false,
    );
  });
});
