import type { HandoffReason, QuickOption, Understanding } from '@nexo/contracts';
import { HANDOFF_REASON_LABELS, HANDOFF_STEP_LABEL } from './tools/transferir-para-analista.js';
import type { TurnSession } from './turn-session.js';

export const DEGRADED_TEXT =
  'Não consegui concluir seu atendimento agora. Você pode tentar de novo ou falar com um analista.';
export const HANDOFF_TEXT =
  'Vou transferir você para um analista. Ele recebe o resumo da conversa, então você não precisa repetir nada.';
export const CRITICAL_HANDOFF_TEXT =
  'Como o impacto é crítico, também vou transferir você para um analista, que receberá o resumo do caso.';
const DEGRADED_QUESTION = 'Como prefere seguir?';
const OVERDUE_QUESTION = 'O que você gostaria de fazer com este chamado vencido?';
const PERCENT = 100;

const DEGRADED_OPTIONS: QuickOption[] = [
  { id: 'retry', label: 'Tentar de novo' },
  { id: 'analyst', label: 'Falar com um analista' },
];
const OVERDUE_OPTIONS: QuickOption[] = [
  { id: 'analyst', label: 'Falar com um analista' },
  { id: 'add-information', label: 'Adicionar informação' },
  { id: 'no-thanks', label: 'Não, obrigado' },
];

function offerOptions(turn: TurnSession, question: string, options: QuickOption[]): void {
  turn.emit({ type: 'part', part: { type: 'quick_options', question, options, answered: false } });
}

export function replyDegraded(turn: TurnSession): void {
  turn.say(DEGRADED_TEXT);
  offerOptions(turn, DEGRADED_QUESTION, DEGRADED_OPTIONS);
}

export function offerOverdueOptions(turn: TurnSession): void {
  offerOptions(turn, OVERDUE_QUESTION, OVERDUE_OPTIONS);
}

function buildSummary(understanding: Understanding, reason: HandoffReason): string {
  const confidence = Math.round(understanding.confidence * PERCENT);
  const motive = HANDOFF_REASON_LABELS[reason];
  return `${understanding.summary}. Motivo: ${motive}. Confiança do agent: ${confidence}%.`;
}

export function requestHandoff(
  turn: TurnSession,
  understanding: Understanding,
  reason: HandoffReason,
): void {
  const label = HANDOFF_STEP_LABEL;
  const result = `motivo: ${HANDOFF_REASON_LABELS[reason]}`;
  turn.recorder.note(turn.context, { kind: 'handed_off', label, result, status: 'ok' });
  turn.emit({
    type: 'handoff-requested',
    reason,
    summary: buildSummary(understanding, reason),
    confidence: understanding.confidence,
  });
}
