import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../persistence/scripted/in-memory-tickets-api.js';
import { makeTurnContext } from '../persistence/scripted/make-turn-context.js';
import { StepRecorder } from './step-recorder.js';
import { createClassificarPrioridadeTool } from './tools/classificar-prioridade.js';

const FACTS = {
  impact: 'only_me',
  blocksWork: false,
  sameDayCommitment: false,
  hasWorkaround: true,
  kind: 'incident',
} as const;

describe('StepRecorder e regras aplicadas', () => {
  it('coleta as regras devolvidas pelas tools executadas', async () => {
    const { context } = makeTurnContext();
    const recorder = new StepRecorder();
    const tickets = new InMemoryTicketsApi([], { assessment: { rule: 'regra da matriz' } });
    const tool = recorder.wrap(createClassificarPrioridadeTool({ tickets }));
    await tool.execute(FACTS, context);
    expect(recorder.rules).toEqual(['regra da matriz']);
  });

  it('não coleta regras de uma tool que falhou', async () => {
    const { context } = makeTurnContext();
    const recorder = new StepRecorder();
    const tickets = {
      assessPriority: async () => {
        throw new Error('falha');
      },
    };
    const tool = recorder.wrap(createClassificarPrioridadeTool({ tickets }));
    await expect(tool.execute(FACTS, context)).rejects.toThrow();
    expect(recorder.rules).toEqual([]);
  });
});
