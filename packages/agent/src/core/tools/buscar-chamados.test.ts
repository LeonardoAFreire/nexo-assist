import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createBuscarChamadosTool } from './buscar-chamados.js';

const ANA_ID = '11111111-1111-4111-8111-111111111111';
const BRUNO_ID = '22222222-2222-4222-8222-222222222222';

function makeTool() {
  const tickets = new InMemoryTicketsApi([
    {
      requesterId: ANA_ID,
      ticket: makeTicket({ number: 'INC-20311', title: 'Notebook lento', description: 'trava' }),
    },
    {
      requesterId: ANA_ID,
      ticket: makeTicket({
        number: 'INC-20150',
        title: 'VPN caiu',
        status: 'resolved',
        description: 'erro 809',
      }),
    },
    {
      requesterId: BRUNO_ID,
      ticket: makeTicket({ number: 'INC-20999', title: 'Notebook do Bruno', description: 'trava' }),
    },
  ]);
  return createBuscarChamadosTool({ tickets });
}

async function numbersFor(input: { scope: 'open' | 'closed' | 'all'; query?: string }) {
  const { context } = makeTurnContext({ requesterId: ANA_ID });
  const output = await makeTool().execute(input, context);
  return output.tickets.map((ticket) => ticket.number);
}

describe('buscar_chamados', () => {
  it('lista só os chamados do funcionário da sessão', async () => {
    expect(await numbersFor({ scope: 'all' })).toEqual(['INC-20311', 'INC-20150']);
  });

  it('filtra por escopo aberto e encerrado', async () => {
    expect(await numbersFor({ scope: 'open' })).toEqual(['INC-20311']);
    expect(await numbersFor({ scope: 'closed' })).toEqual(['INC-20150']);
  });

  it('busca por assunto sem trazer chamados de outro funcionário', async () => {
    expect(await numbersFor({ scope: 'all', query: 'notebook' })).toEqual(['INC-20311']);
  });

  it('aplica o escopo também na busca por assunto', async () => {
    expect(await numbersFor({ scope: 'closed', query: 'notebook' })).toEqual([]);
    expect(await numbersFor({ scope: 'closed', query: 'vpn' })).toEqual(['INC-20150']);
  });

  it('rejeita requesterId e argumentos extras vindos do modelo', () => {
    const { inputSchema } = makeTool();
    expect(inputSchema.safeParse({ scope: 'all', requesterId: BRUNO_ID }).success).toBe(false);
    expect(inputSchema.safeParse({ scope: 'tudo' }).success).toBe(false);
  });

  it('resume o resultado com a contagem', () => {
    const tool = makeTool();
    expect(tool.stepResult({ scope: 'all' }, { tickets: [] })).toBe('nenhum chamado encontrado');
  });
});
