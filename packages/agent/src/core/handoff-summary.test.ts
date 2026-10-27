import { describe, expect, it } from 'vitest';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';

async function summaryFor(summary: string): Promise<string | undefined> {
  const understanding = makeUnderstanding({ intent: 'analyst_request', summary });
  const { collect } = makeAgentHarness({ script: [{ type: 'understand', understanding }] });
  const events = await collect();
  const handoff = events.find((event) => event.type === 'handoff-requested');
  return handoff?.type === 'handoff-requested' ? handoff.summary : undefined;
}

describe('resumo da transferência', () => {
  it('não duplica o ponto final quando o entendimento já termina em ponto', async () => {
    const text = await summaryFor('Funcionária Ana Souza pede para falar com um analista.');
    expect(text).toBe(
      'Funcionária Ana Souza pede para falar com um analista. Motivo: pedido do funcionário. Confiança do agent: 90%.',
    );
  });

  it('mantém o resumo quando o entendimento vem sem ponto final', async () => {
    const text = await summaryFor('Ana pede um analista');
    expect(text).toBe(
      'Ana pede um analista. Motivo: pedido do funcionário. Confiança do agent: 90%.',
    );
  });
});
