import { ticketNumberSchema } from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';
import { type OwnTicketLookup, findOwnTicket } from './find-own-ticket.js';

const inputSchema = z.strictObject({ number: ticketNumberSchema });
const outputSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('shown'), overdue: z.boolean() }),
  z.object({ status: z.literal('not_found') }),
]);

const OVERDUE_RULE = 'chamado vencido: o prazo passou, então o agent oferece falar com um analista';

export type MostrarChamadoInput = z.infer<typeof inputSchema>;
export type MostrarChamadoOutput = z.infer<typeof outputSchema>;
export type MostrarChamadoDeps = { tickets: OwnTicketLookup };

async function showTicket(
  tickets: OwnTicketLookup,
  input: MostrarChamadoInput,
  context: TurnContext,
): Promise<MostrarChamadoOutput> {
  const owner = { requesterId: context.requesterId, number: input.number };
  const ticket = await findOwnTicket(tickets, owner);
  if (!ticket) {
    return { status: 'not_found' };
  }
  context.emit({ type: 'part', part: { type: 'ticket_card', ticket } });
  return { status: 'shown', overdue: ticket.overdue };
}

function describeResult(output: MostrarChamadoOutput): string {
  if (output.status === 'not_found') {
    return 'chamado não encontrado';
  }
  return output.overdue ? 'chamado vencido' : 'chamado exibido';
}

function stepLabelFor(input: MostrarChamadoInput, output: MostrarChamadoOutput): string {
  if (output.status === 'not_found') {
    return `procurou o ${input.number}`;
  }
  return output.overdue ? `consultou o SLA do ${input.number}` : `mostrou o ${input.number}`;
}

export function createMostrarChamadoTool(
  deps: MostrarChamadoDeps,
): AgentTool<MostrarChamadoInput, MostrarChamadoOutput> {
  return {
    name: 'mostrar_chamado',
    description:
      'Mostra ao funcionário o cartão de um dos próprios chamados, com status, prazo e se está vencido. Use quando ele citar o número ou se referir a um chamado já mencionado na conversa. Se devolver overdue verdadeiro, não escreva mais nada: o sistema explica o prazo vencido e oferece as opções.',
    stepKind: 'viewed_ticket',
    failureLabel: 'mostrou um chamado',
    inputSchema,
    outputSchema,
    stepLabel: (input, output) => stepLabelFor(input, output),
    stepResult: (_input, output) => describeResult(output),
    rules: (_input, output) => (output.status === 'shown' && output.overdue ? [OVERDUE_RULE] : []),
    execute: (input, context) => showTicket(deps.tickets, input, context),
  };
}
