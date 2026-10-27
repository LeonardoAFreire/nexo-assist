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

  it('devolve as tools finalizadoras da intenção, e nenhuma para agradecimento ou fora de TI', () => {
    const open = policy.finishingToolsFor(makeUnderstanding({ intent: 'ticket_open' }));
    expect(open).toContain('propor_chamado');
    for (const intent of ['closing', 'other', 'out_of_scope'] as const) {
      expect(policy.finishingToolsFor(makeUnderstanding({ intent }))).toEqual([]);
    }
  });

  it('não exige tool finalizadora enquanto há uma ação pendente de confirmação', () => {
    const understanding = makeUnderstanding({ intent: 'ticket_open' });
    expect(policy.finishingToolsFor(understanding, true)).toEqual([]);
  });
});
