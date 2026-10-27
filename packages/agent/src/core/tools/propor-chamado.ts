import {
  type PriorityAssessment,
  type TicketDraft,
  type TicketsApi,
  priorityFactsSchema,
  ticketAffectedSchema,
  ticketCategorySchema,
  ticketDraftSchema,
  ticketNumberSchema,
  ticketSummarySchema,
  ticketTypeSchema,
} from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';
import { overrideRules, splitDuplicates } from './duplicate-override.js';
import { emitProposal } from './emit-proposal.js';
import { priorityLabel } from './priority-labels.js';

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 1000;
const MAX_OVERRIDES = 5;
const STEP_LABEL = 'montou o rascunho';

const inputSchema = z.strictObject({
  title: z.string().trim().min(1).max(TITLE_MAX_LENGTH),
  description: z.string().trim().min(1).max(DESCRIPTION_MAX_LENGTH),
  type: ticketTypeSchema,
  category: ticketCategorySchema,
  affected: ticketAffectedSchema,
  priorityFacts: z.strictObject(priorityFactsSchema.shape),
  notDuplicateOf: z.array(ticketNumberSchema).max(MAX_OVERRIDES).optional(),
});
const rulesSchema = z.array(z.string());
const outputSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('proposed'), draft: ticketDraftSchema, rules: rulesSchema }),
  z.object({
    status: z.literal('duplicate_found'),
    duplicates: z.array(ticketSummarySchema),
    rules: rulesSchema,
  }),
]);

export type ProporChamadoInput = z.infer<typeof inputSchema>;
export type ProporChamadoOutput = z.infer<typeof outputSchema>;
export type ProporChamadoDeps = {
  tickets: Pick<TicketsApi, 'findDuplicates' | 'assessPriority'>;
};

function buildDraft(input: ProporChamadoInput, assessment: PriorityAssessment): TicketDraft {
  const { title, description, type, category, affected, priorityFacts } = input;
  const { priority, dueAt, rule } = assessment;
  return { title, description, type, category, affected, priorityFacts, priority, dueAt, rule };
}

async function proposeTicket(
  deps: ProporChamadoDeps,
  input: ProporChamadoInput,
  context: TurnContext,
): Promise<ProporChamadoOutput> {
  const { requesterId } = context;
  const text = `${input.title}\n${input.description}`;
  const check = await deps.tickets.findDuplicates({ requesterId, category: input.category, text });
  const { blocking, overridden } = splitDuplicates(check, input.notDuplicateOf ?? []);
  const rules = [check.rule, ...overrideRules(overridden)];
  if (blocking.length > 0) {
    return { status: 'duplicate_found', duplicates: blocking, rules };
  }
  const assessment = await deps.tickets.assessPriority(input.priorityFacts);
  const draft = buildDraft(input, assessment);
  emitProposal(context, { kind: 'create_ticket', draft });
  return { status: 'proposed', draft, rules: [...rules, assessment.rule] };
}

function describeResult(output: ProporChamadoOutput): string {
  if (output.status === 'duplicate_found') {
    const numbers = output.duplicates.map((ticket) => ticket.number).join(', ');
    return `chamado aberto equivalente: ${numbers}`;
  }
  return `rascunho com prioridade ${priorityLabel(output.draft.priority)}`;
}

export function createProporChamadoTool(
  deps: ProporChamadoDeps,
): AgentTool<ProporChamadoInput, ProporChamadoOutput> {
  return {
    name: 'propor_chamado',
    description:
      'Propõe um rascunho de chamado para o funcionário confirmar; nada é criado antes da confirmação, e a prioridade e o prazo são calculados aqui. Use quando já souber quem é afetado. Em priorityFacts, blocksWork, sameDayCommitment e hasWorkaround só são verdadeiros quando o funcionário disse isso; não deduza do tipo de problema. Se existir chamado aberto equivalente, devolve duplicate_found sem propor: nesse caso use propor_complemento nesse chamado. Só informe notDuplicateOf com números desses chamados quando o problema for de fato outro.',
    stepKind: 'built_draft',
    failureLabel: STEP_LABEL,
    inputSchema,
    outputSchema,
    stepLabel: () => STEP_LABEL,
    stepResult: (_input, output) => describeResult(output),
    rules: (_input, output) => output.rules,
    execute: (input, context) => proposeTicket(deps, input, context),
  };
}
