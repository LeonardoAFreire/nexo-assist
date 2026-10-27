import { type TicketsApi, ticketNumberSchema } from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';
import { countLabel } from './count-label.js';

const MIN_NUMBERS = 2;
const MAX_NUMBERS = 6;

const inputSchema = z.strictObject({
  numbers: z.array(ticketNumberSchema).min(MIN_NUMBERS).max(MAX_NUMBERS),
});
const outputSchema = z.object({ shown: z.array(ticketNumberSchema) });

export type MostrarSelecaoInput = z.infer<typeof inputSchema>;
export type MostrarSelecaoOutput = z.infer<typeof outputSchema>;
export type MostrarSelecaoDeps = { tickets: Pick<TicketsApi, 'listOwn'> };

async function showSelection(
  tickets: MostrarSelecaoDeps['tickets'],
  input: MostrarSelecaoInput,
  context: TurnContext,
): Promise<MostrarSelecaoOutput> {
  const own = await tickets.listOwn({ requesterId: context.requesterId, scope: 'all' });
  const requested = new Set(input.numbers);
  const selected = own.filter((ticket) => requested.has(ticket.number));
  if (selected.length > 0) {
    const part = { type: 'ticket_selection', tickets: selected, selectedNumber: null } as const;
    context.emit({ type: 'part', part });
  }
  return { shown: selected.map((ticket) => ticket.number) };
}

export function createMostrarSelecaoTool(
  deps: MostrarSelecaoDeps,
): AgentTool<MostrarSelecaoInput, MostrarSelecaoOutput> {
  return {
    name: 'mostrar_selecao',
    description:
      'Mostra ao funcionário uma lista de 2 a 6 dos próprios chamados para ele escolher um. Números que não são dele são ignorados.',
    stepKind: 'searched_tickets',
    failureLabel: 'listou seus chamados para escolha',
    inputSchema,
    outputSchema,
    stepLabel: () => 'listou seus chamados para escolha',
    stepResult: (_input, output) =>
      countLabel(output.shown.length, {
        none: 'nenhum chamado listado',
        one: 'chamado listado',
        many: 'chamados listados',
      }),
    execute: (input, context) => showSelection(deps.tickets, input, context),
  };
}
