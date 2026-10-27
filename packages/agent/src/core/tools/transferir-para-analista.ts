import { type HandoffReason, handoffReasonSchema } from '@nexo/contracts';
import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';

const SUMMARY_MAX_LENGTH = 600;
const STEP_LABEL = 'transferiu para um analista';

const REASON_LABELS: Record<HandoffReason, string> = {
  requested: 'pedido do funcionário',
  critical: 'prioridade crítica',
  overdue: 'chamado vencido',
  low_confidence: 'baixa confiança do agent',
  failure: 'falha repetida',
};

const inputSchema = z.strictObject({
  reason: handoffReasonSchema,
  summary: z.string().trim().min(1).max(SUMMARY_MAX_LENGTH),
});
const outputSchema = z.object({ reason: handoffReasonSchema });

export type TransferirParaAnalistaInput = z.infer<typeof inputSchema>;
export type TransferirParaAnalistaOutput = z.infer<typeof outputSchema>;

function requestHandoff(
  input: TransferirParaAnalistaInput,
  context: TurnContext,
): TransferirParaAnalistaOutput {
  context.emit({
    type: 'handoff-requested',
    reason: input.reason,
    summary: input.summary,
    confidence: null,
  });
  return { reason: input.reason };
}

export function createTransferirParaAnalistaTool(): AgentTool<
  TransferirParaAnalistaInput,
  TransferirParaAnalistaOutput
> {
  return {
    name: 'transferir_para_analista',
    description:
      'Transfere a conversa para um analista humano, com o motivo e um resumo do caso para que o analista não recomece a conversa. A transferência é executada pelo sistema.',
    stepKind: 'handed_off',
    failureLabel: STEP_LABEL,
    inputSchema,
    outputSchema,
    stepLabel: () => STEP_LABEL,
    stepResult: (_input, output) => `motivo: ${REASON_LABELS[output.reason]}`,
    execute: async (input, context) => requestHandoff(input, context),
  };
}
