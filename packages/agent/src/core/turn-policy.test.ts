import { describe, expect, it } from 'vitest';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import type { AgentTool } from './agent-tool.js';
import { TurnPolicy } from './turn-policy.js';

const THRESHOLD = 0.6;

describe('TurnPolicy', () => {
  const policy = new TurnPolicy(THRESHOLD);

  it('transfere a pedido do funcionário mesmo com confiança alta', () => {
    const route = policy.decide(makeUnderstanding({ intent: 'analyst_request' }));
    expect(route).toEqual({ kind: 'handoff', reason: 'requested' });
  });

  it('transfere por baixa confiança abaixo do limite e responde no limite', () => {
    expect(policy.decide(makeUnderstanding({ confidence: 0.59 }))).toEqual({
      kind: 'handoff',
      reason: 'low_confidence',
    });
    expect(policy.decide(makeUnderstanding({ confidence: THRESHOLD }))).toEqual({
      kind: 'respond',
    });
  });

  it('redireciona assunto fora de TI sem tools e oferece todas na rota de resposta', () => {
    const route = policy.decide(makeUnderstanding({ intent: 'out_of_scope' }));
    const tools = [{ name: 'buscar_chamados' }] as AgentTool[];
    expect(route).toEqual({ kind: 'redirect' });
    expect(policy.toolsFor(route, tools)).toEqual([]);
    expect(policy.toolsFor({ kind: 'respond' }, tools)).toEqual(tools);
  });

  it('prioriza o pedido de analista sobre a baixa confiança', () => {
    const understanding = makeUnderstanding({ intent: 'analyst_request', confidence: 0.2 });
    expect(policy.decide(understanding)).toEqual({ kind: 'handoff', reason: 'requested' });
  });

  it('exige uma tool no primeiro passo quando a intenção depende de dados do sistema', () => {
    const intents = ['question', 'ticket_status', 'ticket_complement', 'ticket_open'] as const;
    for (const intent of intents) {
      expect(policy.requiresToolFirst(makeUnderstanding({ intent }))).toBe(true);
    }
  });

  it('não exige tool em agradecimento, assunto solto ou fora de TI', () => {
    for (const intent of ['closing', 'other', 'out_of_scope'] as const) {
      expect(policy.requiresToolFirst(makeUnderstanding({ intent }))).toBe(false);
    }
  });
});
