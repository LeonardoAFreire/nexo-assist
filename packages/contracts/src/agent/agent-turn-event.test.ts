import { describe, expect, it } from 'vitest';
import { agentTurnEventSchema } from './agent-turn-event.js';

const step = {
  id: 's1',
  kind: 'searched_tickets',
  label: 'consultou seus chamados',
  result: '3 chamados encontrados',
  status: 'ok',
  attempts: 1,
  durationMs: 98,
};

describe('agentTurnEventSchema', () => {
  it('discrimina passo, trecho de texto, transferência e falha pelo type', () => {
    const events = [
      { type: 'step', step },
      { type: 'text-delta', delta: 'Você tem 3 chamados.' },
      { type: 'handoff-requested', reason: 'low_confidence', summary: 'resumo', confidence: 0.41 },
      { type: 'failed', code: 'budget_exhausted', retryable: false },
    ];
    const types = events.map((event) => agentTurnEventSchema.parse(event).type);
    expect(types).toEqual(['step', 'text-delta', 'handoff-requested', 'failed']);
  });

  it('aceita proposta de complemento com o alvo e o texto', () => {
    const result = agentTurnEventSchema.safeParse({
      type: 'proposal',
      kind: 'complement_ticket',
      draft: null,
      targetNumber: 'INC-20311',
      complement: 'Continua lento hoje.',
    });
    expect(result.success).toBe(true);
  });

  it('recusa type desconhecido e código de falha fora da lista', () => {
    expect(agentTurnEventSchema.safeParse({ type: 'unknown' }).success).toBe(false);
    expect(
      agentTurnEventSchema.safeParse({ type: 'failed', code: 'timeout', retryable: true }).success,
    ).toBe(false);
  });

  it('recusa passo com tentativas zeradas', () => {
    const result = agentTurnEventSchema.safeParse({ type: 'step', step: { ...step, attempts: 0 } });
    expect(result.success).toBe(false);
  });
});
