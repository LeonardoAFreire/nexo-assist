import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createConsultarChamadoTool } from './consultar-chamado.js';

const ANA_ID = '11111111-1111-4111-8111-111111111111';
const BRUNO_ID = '22222222-2222-4222-8222-222222222222';

function makeTool() {
  const tickets = new InMemoryTicketsApi([
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20311' }) },
    {
      requesterId: BRUNO_ID,
      ticket: makeTicket({ number: 'INC-20999', title: 'Segredo do Bruno' }),
    },
  ]);
  return createConsultarChamadoTool({ tickets });
}

describe('consultar_chamado', () => {
  it('devolve o chamado do próprio funcionário', async () => {
    const { context } = makeTurnContext({ requesterId: ANA_ID });
    const output = await makeTool().execute({ number: 'INC-20311' }, context);
    expect(output).toMatchObject({ status: 'found', ticket: { number: 'INC-20311' } });
  });

  it('devolve o mesmo not_found para chamado alheio e para chamado inexistente', async () => {
    const { context } = makeTurnContext({ requesterId: ANA_ID });
    const tool = makeTool();
    const foreign = await tool.execute({ number: 'INC-20999' }, context);
    const missing = await tool.execute({ number: 'INC-00001' }, context);
    expect(foreign).toEqual({ status: 'not_found' });
    expect(missing).toEqual(foreign);
    expect(tool.stepResult({ number: 'INC-20999' }, foreign)).toBe(
      tool.stepResult({ number: 'INC-00001' }, missing),
    );
  });

  it('usa o requesterId do contexto da sessão', async () => {
    const { context } = makeTurnContext({ requesterId: BRUNO_ID });
    const output = await makeTool().execute({ number: 'INC-20999' }, context);
    expect(output).toMatchObject({ status: 'found', ticket: { title: 'Segredo do Bruno' } });
  });

  it('rejeita requesterId e outros argumentos extras vindos do modelo', () => {
    const { inputSchema } = makeTool();
    expect(inputSchema.safeParse({ number: 'INC-20311', requesterId: BRUNO_ID }).success).toBe(
      false,
    );
    expect(inputSchema.safeParse({ number: 'INC-20311', extra: 1 }).success).toBe(false);
  });

  it('rejeita número fora do padrão', () => {
    const { inputSchema } = makeTool();
    expect(inputSchema.safeParse({ number: 'INC-1' }).success).toBe(false);
    expect(inputSchema.safeParse({ number: 'XYZ-20311' }).success).toBe(false);
  });
});
