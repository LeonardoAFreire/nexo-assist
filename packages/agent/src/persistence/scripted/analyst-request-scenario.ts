import type { Scenario } from './scenario.js';
import { understandingOf } from './scenario-understanding.js';
import { UnscriptedLlmCallError } from './scripted-llm-client.js';

export const analystRequestScenario: Scenario = {
  name: 'pedido-de-analista',
  trigger: /analista|atendente/i,
  understanding: understandingOf({
    intent: 'analyst_request',
    summary: 'Funcionário pede para falar com um analista',
  }),
  async reply() {
    throw new UnscriptedLlmCallError('o pedido de analista é resolvido pela transferência');
  },
};
