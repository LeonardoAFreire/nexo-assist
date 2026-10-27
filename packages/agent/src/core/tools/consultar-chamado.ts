import { ticketDetailSchema, ticketNumberSchema } from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import { type OwnTicketLookup, findOwnTicket } from './find-own-ticket.js';

const NOT_FOUND_RESULT = 'chamado não encontrado';

const inputSchema = z.strictObject({ number: ticketNumberSchema });
const outputSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('found'), ticket: ticketDetailSchema }),
  z.object({ status: z.literal('not_found') }),
]);

export type ConsultarChamadoInput = z.infer<typeof inputSchema>;
export type ConsultarChamadoOutput = z.infer<typeof outputSchema>;
export type ConsultarChamadoDeps = { tickets: OwnTicketLookup };

async function lookupTicket(
  tickets: OwnTicketLookup,
  requesterId: string,
  input: ConsultarChamadoInput,
): Promise<ConsultarChamadoOutput> {
  const ticket = await findOwnTicket(tickets, { requesterId, number: input.number });
  return ticket ? { status: 'found', ticket } : { status: 'not_found' };
}

export function createConsultarChamadoTool(
  deps: ConsultarChamadoDeps,
): AgentTool<ConsultarChamadoInput, ConsultarChamadoOutput> {
  return {
    name: 'consultar_chamado',
    description:
      'Consulta um chamado do próprio funcionário pelo número (INC-00000 ou REQ-00000). Devolve not_found quando o chamado não existe ou não pertence ao funcionário.',
    stepKind: 'viewed_ticket',
    failureLabel: 'consultou um chamado',
    inputSchema,
    outputSchema,
    stepLabel: (input) => `consultou o ${input.number}`,
    stepResult: (_input, output) =>
      output.status === 'found' ? output.ticket.title : NOT_FOUND_RESULT,
    execute: (input, context) => lookupTicket(deps.tickets, context.requesterId, input),
  };
}
