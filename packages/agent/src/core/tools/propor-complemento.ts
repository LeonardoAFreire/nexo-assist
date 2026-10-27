import { ticketNumberSchema } from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';
import { emitProposal } from './emit-proposal.js';
import { type OwnTicketLookup, findOwnTicket } from './find-own-ticket.js';
import { isOpenTicket } from './ticket-status-rules.js';

const COMPLEMENT_MAX_LENGTH = 1000;
const CLOSED_TICKET_RULE =
  'chamado resolvido não recebe complemento: proponha reabrir ou abrir outro';

const inputSchema = z.strictObject({
  number: ticketNumberSchema,
  complement: z.string().trim().min(1).max(COMPLEMENT_MAX_LENGTH),
});
const outputSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('proposed'), number: z.string() }),
  z.object({ status: z.literal('ticket_closed'), number: z.string(), rule: z.string() }),
  z.object({ status: z.literal('not_found') }),
]);

export type ProporComplementoInput = z.infer<typeof inputSchema>;
export type ProporComplementoOutput = z.infer<typeof outputSchema>;
export type ProporComplementoDeps = { tickets: OwnTicketLookup };

async function proposeComplement(
  tickets: OwnTicketLookup,
  input: ProporComplementoInput,
  context: TurnContext,
): Promise<ProporComplementoOutput> {
  const { number, complement } = input;
  const ticket = await findOwnTicket(tickets, { requesterId: context.requesterId, number });
  if (!ticket) {
    return { status: 'not_found' };
  }
  if (!isOpenTicket(ticket)) {
    return { status: 'ticket_closed', number, rule: CLOSED_TICKET_RULE };
  }
  emitProposal(context, { kind: 'complement_ticket', targetNumber: number, complement });
  return { status: 'proposed', number };
}

function describeResult(output: ProporComplementoOutput): string {
  if (output.status === 'not_found') {
    return 'chamado não encontrado';
  }
  return output.status === 'ticket_closed' ? output.rule : 'complemento pronto para confirmação';
}

export function createProporComplementoTool(
  deps: ProporComplementoDeps,
): AgentTool<ProporComplementoInput, ProporComplementoOutput> {
  return {
    name: 'propor_complemento',
    description:
      'Propõe acrescentar uma informação a um chamado aberto do próprio funcionário. O complemento só é gravado após a confirmação do funcionário.',
    stepKind: 'proposed_update',
    failureLabel: 'preparou um complemento',
    inputSchema,
    outputSchema,
    stepLabel: (input) => `preparou o complemento do ${input.number}`,
    stepResult: (_input, output) => describeResult(output),
    rules: (_input, output) => (output.status === 'ticket_closed' ? [output.rule] : []),
    execute: (input, context) => proposeComplement(deps.tickets, input, context),
  };
}
