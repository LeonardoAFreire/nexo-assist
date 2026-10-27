import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createMostrarSelecaoTool } from './mostrar-selecao.js';

const ANA_ID = '11111111-1111-4111-8111-111111111111';
const BRUNO_ID = '22222222-2222-4222-8222-222222222222';

function makeTool() {
  const tickets = new InMemoryTicketsApi([
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20311' }) },
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20150' }) },
    { requesterId: BRUNO_ID, ticket: makeTicket({ number: 'INC-20999' }) },
  ]);
  return createMostrarSelecaoTool({ tickets });
}

describe('mostrar_selecao', () => {
  it('mostra só os números que são do funcionário', async () => {
    const { context, events } = makeTurnContext({ requesterId: ANA_ID });
    const input = { numbers: ['INC-20311', 'INC-20999', 'INC-20150'] };
    const output = await makeTool().execute(input, context);
    expect(output.shown).toEqual(['INC-20311', 'INC-20150']);
    expect(JSON.stringify(events)).not.toContain('INC-20999');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'part', part: { type: 'ticket_selection' } });
  });

  it('não emite seleção quando nenhum número é do funcionário', async () => {
    const { context, events } = makeTurnContext({ requesterId: ANA_ID });
    const output = await makeTool().execute({ numbers: ['INC-20999', 'INC-00001'] }, context);
    expect(output.shown).toEqual([]);
    expect(events).toEqual([]);
  });

  it('aceita de 2 a 6 números', () => {
    const { inputSchema } = makeTool();
    const numbers = (count: number) =>
      Array.from({ length: count }, (_, index) => `INC-2000${index}`);
    expect(inputSchema.safeParse({ numbers: numbers(1) }).success).toBe(false);
    expect(inputSchema.safeParse({ numbers: numbers(6) }).success).toBe(true);
    expect(inputSchema.safeParse({ numbers: numbers(7) }).success).toBe(false);
  });

  it('resume o resultado com a contagem', () => {
    const tool = makeTool();
    expect(tool.stepResult({ numbers: [] }, { shown: ['INC-20311', 'INC-20150'] })).toBe(
      '2 chamados listados',
    );
  });
});
