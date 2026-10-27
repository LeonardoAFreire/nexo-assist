import { describe, expect, it } from 'vitest';
import { makeAgentHarness } from '../persistence/scripted/make-agent-harness.js';
import type { AgentLogger, LogFields } from './agent-logger.js';

class SpyLogger implements AgentLogger {
  readonly warnings: { fields: LogFields; message: string }[] = [];

  info(): void {}

  warn(fields: LogFields, message: string): void {
    this.warnings.push({ fields, message });
  }
}

describe('AgentService, turno que falha', () => {
  it('registra o tipo do erro e a conversa, sem o texto da mensagem do funcionário', async () => {
    const logger = new SpyLogger();
    const { collect } = makeAgentHarness({ script: [], logger });
    const events = await collect({ userMessage: 'minha senha é abc123, não registre isso' });
    expect(events).toEqual([{ type: 'failed', code: 'agent_unavailable', retryable: true }]);
    const [warning] = logger.warnings;
    expect(warning?.message).toBe('turno do agent falhou');
    expect(warning?.fields).toMatchObject({ module: 'agent', errorName: 'UnscriptedLlmCallError' });
    expect(JSON.stringify(warning?.fields)).not.toContain('abc123');
  });
});
