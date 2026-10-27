import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createClassificarPrioridadeTool } from './classificar-prioridade.js';

const FACTS = {
  impact: 'only_me',
  blocksWork: false,
  sameDayCommitment: false,
  hasWorkaround: true,
  kind: 'incident',
} as const;

function makeTool() {
  const tickets = new InMemoryTicketsApi([], {
    assessment: {
      priority: 'high',
      deadline: { amount: 1, unit: 'business_days' },
      rule: 'regra X',
    },
  });
  return createClassificarPrioridadeTool({ tickets });
}

describe('classificar_prioridade', () => {
  it('devolve a avaliação calculada pelo sistema de chamados', async () => {
    const { context } = makeTurnContext();
    const output = await makeTool().execute(FACTS, context);
    expect(output).toMatchObject({ priority: 'high', rule: 'regra X' });
  });

  it('resume prioridade e prazo e expõe a regra aplicada', async () => {
    const { context } = makeTurnContext();
    const tool = makeTool();
    const output = await tool.execute(FACTS, context);
    expect(tool.stepResult(FACTS, output)).toBe('prioridade alta, prazo de 1 dia útil');
    expect(tool.rules?.(FACTS, output)).toEqual(['regra X']);
  });

  it('rejeita requesterId e fatos inválidos vindos do modelo', () => {
    const { inputSchema } = makeTool();
    expect(inputSchema.safeParse({ ...FACTS, requesterId: 'x' }).success).toBe(false);
    expect(inputSchema.safeParse({ ...FACTS, impact: 'todos' }).success).toBe(false);
  });
});
