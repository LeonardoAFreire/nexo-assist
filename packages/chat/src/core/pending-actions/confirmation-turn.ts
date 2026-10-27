import type {
  AgentIntent,
  AgentTurn,
  ConfirmationChannel,
  PendingActionKind,
} from '@nexo/contracts';

const CERTAIN_CONFIDENCE = 1;

const STEP_LABEL: Record<PendingActionKind, string> = {
  create_ticket: 'criou um chamado',
  complement_ticket: 'atualizou o chamado',
  reopen_ticket: 'reabriu o chamado',
};

const INTENT: Record<PendingActionKind, AgentIntent> = {
  create_ticket: 'ticket_open',
  complement_ticket: 'ticket_complement',
  reopen_ticket: 'ticket_complement',
};

const CHANNEL_LABEL: Record<ConfirmationChannel, string> = {
  button: 'botão',
  shortcut: 'atalho',
  text: 'texto',
};

export type ConfirmationTurnInput = {
  kind: PendingActionKind;
  via: ConfirmationChannel;
  ticketNumber: string;
  attempts: number;
  durationMs: number;
};

export function buildConfirmationTurn(input: ConfirmationTurnInput): AgentTurn {
  const label = STEP_LABEL[input.kind];
  return {
    steps: [
      {
        id: 'confirmation-1',
        kind: 'executed_action',
        label,
        result: input.ticketNumber,
        status: 'ok',
        attempts: input.attempts,
        durationMs: input.durationMs,
      },
    ],
    decision: {
      understood: {
        intent: INTENT[input.kind],
        intentLabel: 'Confirmação do funcionário',
        summary: `O funcionário confirmou pelo ${CHANNEL_LABEL[input.via]}.`,
        entities: [{ label: 'Chamado', value: input.ticketNumber }],
      },
      action: { kind: 'executed_action', label },
      confidence: { value: CERTAIN_CONFIDENCE, label: 'alta' },
      reason: `Confirmação registrada pelo ${CHANNEL_LABEL[input.via]}.`,
      rules: [],
      handoff: null,
    },
  };
}
