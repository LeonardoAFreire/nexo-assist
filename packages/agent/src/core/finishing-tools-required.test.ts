import { describe, expect, it } from 'vitest';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import { ScriptedLlmClient } from '../persistence/scripted/scripted-llm-client.js';
import type { RespondInput } from './llm-client.js';

class RecordingLlm extends ScriptedLlmClient {
  readonly requested: string[][] = [];

  override respond(input: RespondInput) {
    this.requested.push(input.finishingTools);
    return super.respond(input);
  }
}

async function requestedFor(intent: 'ticket_open' | 'closing'): Promise<string[][]> {
  const llm = new RecordingLlm([
    { type: 'understand', understanding: makeUnderstanding({ intent }) },
    { type: 'respond', text: 'Certo.', toolCalls: [] },
  ]);
  const { collect } = makeAgentHarness({ script: [], llm });
  await collect();
  return llm.requested;
}

describe('tool obrigatória até a finalizadora', () => {
  it('pede ao modelo uma tool primeiro quando o funcionário quer abrir chamado', async () => {
    const [finishing] = await requestedFor('ticket_open');
    expect(finishing).toContain('propor_chamado');
  });

  it('deixa o modelo livre para responder quando o funcionário só agradece', async () => {
    expect(await requestedFor('closing')).toEqual([[]]);
  });
});
