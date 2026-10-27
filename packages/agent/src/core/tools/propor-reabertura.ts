import { type TicketDetail, ticketNumberSchema } from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';
import { emitProposal } from './emit-proposal.js';
import { type OwnTicketLookup, findOwnTicket } from './find-own-ticket.js';
import { RESOLVED_STATUS } from './ticket-status-rules.js';

const REASON_MAX_LENGTH = 500;
const REOPEN_WINDOW_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const STILL_OPEN_RULE = 'chamado ainda está aberto: não há o que reabrir';
const WINDOW_EXPIRED_RULE = `chamado resolvido há mais de ${REOPEN_WINDOW_DAYS} dias: não pode ser reaberto`;

const inputSchema = z.strictObject({
  number: ticketNumberSchema,
  reason: z.string().trim().min(1).max(REASON_MAX_LENGTH),
});
const outputSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('proposed'), number: z.string(), rule: z.string() }),
  z.object({ status: z.literal('rule_violated'), number: z.string(), rule: z.string() }),
  z.object({ status: z.literal('not_found') }),
]);

export type ProporReaberturaInput = z.infer<typeof inputSchema>;
export type ProporReaberturaOutput = z.infer<typeof outputSchema>;
export type ProporReaberturaDeps = { tickets: OwnTicketLookup };

function evaluateReopen(ticket: TicketDetail, now: Date): ProporReaberturaOutput {
  const { number } = ticket;
  if (ticket.status !== RESOLVED_STATUS || ticket.resolvedAt === null) {
    return { status: 'rule_violated', number, rule: STILL_OPEN_RULE };
  }
  const elapsedMs = now.getTime() - new Date(ticket.resolvedAt).getTime();
  if (elapsedMs > REOPEN_WINDOW_DAYS * MILLISECONDS_PER_DAY) {
    return { status: 'rule_violated', number, rule: WINDOW_EXPIRED_RULE };
  }
  const days = Math.floor(elapsedMs / MILLISECONDS_PER_DAY);
  return {
    status: 'proposed',
    number,
    rule: `chamado resolvido há ${days} dias: pode ser reaberto`,
  };
}

async function proposeReopen(
  tickets: OwnTicketLookup,
  input: ProporReaberturaInput,
  context: TurnContext,
): Promise<ProporReaberturaOutput> {
  const ticket = await findOwnTicket(tickets, {
    requesterId: context.requesterId,
    number: input.number,
  });
  if (!ticket) {
    return { status: 'not_found' };
  }
  const outcome = evaluateReopen(ticket, context.clock.now());
  if (outcome.status === 'proposed') {
    emitProposal(context, {
      kind: 'reopen_ticket',
      targetNumber: input.number,
      complement: input.reason,
    });
  }
  return outcome;
}

function describeResult(output: ProporReaberturaOutput): string {
  return output.status === 'not_found' ? 'chamado não encontrado' : output.rule;
}

export function createProporReaberturaTool(
  deps: ProporReaberturaDeps,
): AgentTool<ProporReaberturaInput, ProporReaberturaOutput> {
  return {
    name: 'propor_reabertura',
    description:
      'Propõe reabrir um chamado resolvido do próprio funcionário quando o mesmo problema voltou, informando o motivo. Esta chamada já pede a confirmação ao funcionário: use-a direto, sem perguntar antes, e a reabertura só acontece depois que ele confirmar. Se o prazo de reabertura tiver passado, a resposta diz isso e o caminho é propor um chamado novo.',
    stepKind: 'proposed_reopen',
    failureLabel: 'propôs reabrir um chamado',
    inputSchema,
    outputSchema,
    stepLabel: (input, output) =>
      output.status === 'proposed'
        ? `propôs reabrir o ${input.number}`
        : `analisou reabrir o ${input.number}`,
    stepResult: (_input, output) => describeResult(output),
    rules: (_input, output) => (output.status === 'not_found' ? [] : [output.rule]),
    execute: (input, context) => proposeReopen(deps.tickets, input, context),
  };
}
