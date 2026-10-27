import type { Understanding } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import { ScriptedLlmClient } from '../persistence/scripted/scripted-llm-client.js';
import { PromptCatalog } from './prompt-catalog.js';
import { UnderstandingStep } from './understanding-step.js';

const MESSAGES = [{ role: 'user' as const, content: 'Minha VPN não conecta' }];
const USAGE = { inputTokens: 120, outputTokens: 30 };

describe('UnderstandingStep', () => {
  it('devolve o entendimento validado e o uso de tokens', async () => {
    const understanding = makeUnderstanding({ intent: 'ticket_open' });
    const llm = new ScriptedLlmClient([{ type: 'understand', understanding, usage: USAGE }]);
    const result = await new UnderstandingStep(llm, new PromptCatalog()).run(MESSAGES);
    expect(result).toEqual({ value: understanding, usage: USAGE });
  });

  it('rejeita um entendimento fora do schema em vez de repassá-lo', async () => {
    const invalid = { ...makeUnderstanding(), confidence: 1.5 } satisfies Understanding;
    const llm = new ScriptedLlmClient([{ type: 'understand', understanding: invalid }]);
    const step = new UnderstandingStep(llm, new PromptCatalog());
    await expect(step.run(MESSAGES)).rejects.toThrow();
  });
});
