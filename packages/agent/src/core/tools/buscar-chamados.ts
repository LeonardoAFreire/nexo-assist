import { type TicketsApi, ticketScopeSchema, ticketSummarySchema } from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import { countLabel } from './count-label.js';
import { filterByScope } from './filter-by-scope.js';

const QUERY_MAX_LENGTH = 200;
const STEP_LABEL = 'consultou seus chamados';

const inputSchema = z.strictObject({
  query: z.string().trim().min(1).max(QUERY_MAX_LENGTH).optional(),
  scope: ticketScopeSchema,
});
const outputSchema = z.object({ tickets: z.array(ticketSummarySchema) });

export type BuscarChamadosInput = z.infer<typeof inputSchema>;
export type BuscarChamadosOutput = z.infer<typeof outputSchema>;
export type BuscarChamadosDeps = { tickets: Pick<TicketsApi, 'listOwn' | 'searchOwn'> };

async function searchTickets(
  tickets: BuscarChamadosDeps['tickets'],
  requesterId: string,
  input: BuscarChamadosInput,
): Promise<BuscarChamadosOutput> {
  if (input.query === undefined) {
    return { tickets: await tickets.listOwn({ requesterId, scope: input.scope }) };
  }
  const found = await tickets.searchOwn({ requesterId, query: input.query });
  return { tickets: filterByScope(found, input.scope) };
}

export function createBuscarChamadosTool(
  deps: BuscarChamadosDeps,
): AgentTool<BuscarChamadosInput, BuscarChamadosOutput> {
  return {
    name: 'buscar_chamados',
    description:
      'Lista ou busca os chamados do próprio funcionário. query filtra por assunto (opcional). scope: open = em andamento, closed = resolvidos ou encerrados, all = todos. Para saber se um problema já tem chamado ou voltou a acontecer, use all, pois um chamado resolvido só aparece em closed e all.',
    stepKind: 'searched_tickets',
    failureLabel: STEP_LABEL,
    inputSchema,
    outputSchema,
    stepLabel: () => STEP_LABEL,
    stepResult: (_input, output) =>
      countLabel(output.tickets.length, {
        none: 'nenhum chamado encontrado',
        one: 'chamado encontrado',
        many: 'chamados encontrados',
      }),
    execute: (input, context) => searchTickets(deps.tickets, context.requesterId, input),
  };
}
