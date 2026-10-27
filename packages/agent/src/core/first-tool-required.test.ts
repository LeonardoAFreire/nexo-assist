import { describe, expect, it } from 'vitest';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import { makeUnderstanding } from '../persistence/scripted/make-understanding.js';
import { ScriptedLlmClient } from '../persistence/scripted/scripted-llm-client.js';
import type { RespondInput } from './llm-client.js';

class RecordingLlm extends ScriptedLlmClient {
  readonly requested: boolean[] = [];

  override respond(input: RespondInput) {
    this.requested.push(input.requireToolFirst);
    return super.respond(input);
  }
}

async function requestedFor(intent: 'ticket_open' | 'closing'): Promise<boolean[]> {
  const llm = new RecordingLlm([
    { type: 'understand', understanding: makeUnderstanding({ intent }) },
    { type: 'respond', text: 'Certo.', toolCalls: [] },
  ]);
  const { collect } = makeAgentHarness({ script: [], llm });
  await collect();
  return llm.requested;
}

describe('tool obrigatória no primeiro passo', () => {
  it('pede ao modelo uma tool primeiro quando o funcionário quer abrir chamado', async () => {
    expect(await requestedFor('ticket_open')).toEqual([true]);
  });

  it('deixa o modelo livre para responder quando o funcionário só agradece', async () => {
    expect(await requestedFor('closing')).toEqual([false]);
  });
});
