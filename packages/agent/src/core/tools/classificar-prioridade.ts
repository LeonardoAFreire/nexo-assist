import {
  type PriorityAssessment,
  type TicketsApi,
  priorityAssessmentSchema,
  priorityFactsSchema,
} from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import { describeAssessment } from './priority-labels.js';

const STEP_LABEL = 'classificou a prioridade';

const inputSchema = z.strictObject(priorityFactsSchema.shape);

export type ClassificarPrioridadeInput = z.infer<typeof inputSchema>;
export type ClassificarPrioridadeOutput = PriorityAssessment;
export type ClassificarPrioridadeDeps = { tickets: Pick<TicketsApi, 'assessPriority'> };

export function createClassificarPrioridadeTool(
  deps: ClassificarPrioridadeDeps,
): AgentTool<ClassificarPrioridadeInput, ClassificarPrioridadeOutput> {
  return {
    name: 'classificar_prioridade',
    description:
      'Calcula a prioridade e o prazo de um chamado a partir de quem é afetado, se bloqueia o trabalho, se há compromisso no mesmo dia, se há alternativa e do tipo. A regra é aplicada pelo sistema, não pelo modelo.',
    stepKind: 'classified_priority',
    failureLabel: STEP_LABEL,
    inputSchema,
    outputSchema: priorityAssessmentSchema,
    stepLabel: () => STEP_LABEL,
    stepResult: (_input, output) => describeAssessment(output),
    rules: (_input, output) => [output.rule],
    execute: (input) => deps.tickets.assessPriority(input),
  };
}
