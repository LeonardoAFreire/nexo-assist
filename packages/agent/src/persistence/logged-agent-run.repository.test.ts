import { describe, expect, it, vi } from 'vitest';
import type { AgentLogger } from '../core/agent-logger.js';
import type { AgentRun } from '../core/agent-run.js';
import { LoggedAgentRunRepository } from './logged-agent-run.repository.js';
import { InMemoryAgentRunRepository } from './scripted/in-memory-agent-run-repository.js';

function makeRun(): AgentRun {
  return {
    id: '2d1c0b9a-8f7e-4d6c-a5b4-3c2d1e0f9a8b',
    conversationId: '4f0a1c9e-3d6b-4a52-9b8e-7c1d2e3f4a5b',
    intent: 'ticket_status',
    confidence: 0.82,
    action: 'respond',
    handoffReason: null,
    steps: [
      {
        id: 's1',
        kind: 'searched_tickets',
        label: 'consultou seus chamados',
        result: 'INC-20311 aberto há 6 dias',
        status: 'ok',
        attempts: 1,
        durationMs: 40,
      },
    ],
    models: ['openai/gpt-4o-mini'],
    inputTokens: 900,
    outputTokens: 120,
    costUsd: 0.0002,
    firstTokenMs: 700,
    durationMs: 2100,
    outcome: 'answered',
    createdAt: '2026-10-27T12:00:00.000Z',
  };
}

describe('LoggedAgentRunRepository', () => {
  it('grava a execução e registra o turno sem textos de passos nem de mensagens', async () => {
    const info = vi.fn<AgentLogger['info']>();
    const logger: AgentLogger = { info, warn: vi.fn() };
    const inner = new InMemoryAgentRunRepository();
    const repository = new LoggedAgentRunRepository(inner, logger);
    await repository.save(makeRun());
    expect(inner.saved).toHaveLength(1);
    const [fields, message] = info.mock.calls[0] ?? [];
    expect(message).toBe('turno concluído');
    expect(fields).toMatchObject({ runId: makeRun().id, steps: ['searched_tickets'] });
    expect(JSON.stringify(fields)).not.toContain('INC-20311');
  });

  it('delega as consultas de custo e de tokens ao repositório', async () => {
    const inner = new InMemoryAgentRunRepository([makeRun()]);
    const repository = new LoggedAgentRunRepository(inner, { info: vi.fn(), warn: vi.fn() });
    await expect(repository.costSince(new Date('2026-10-27T00:00:00.000Z'))).resolves.toBe(0.0002);
    await expect(repository.inputTokensOf(makeRun().conversationId)).resolves.toBe(900);
  });
});
