import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/persistence/scripted/make-agent-harness.js';
import {
  type ScriptedEntry,
  ScriptedLlmClient,
} from '../src/persistence/scripted/scripted-llm-client.js';
import { type AgentProvider, composeAgent } from './compose-agent.js';
import { runScenarioOnce } from './run-scenario.js';
import { chamadoAlheio } from './scenarios/chamado-alheio.js';
import { horarioAtendimento } from './scenarios/horario-atendimento.js';
import { understood } from './scenarios/rehearsal.js';

const USAGE = { inputTokens: 1000, outputTokens: 200 };

function providerWith(script: ScriptedEntry[]): AgentProvider {
  return (_scenario, apis) =>
    composeAgent({ llm: new ScriptedLlmClient(script), settings: DEFAULT_SETTINGS, apis });
}

function failedIds(result: Awaited<ReturnType<typeof runScenarioOnce>>): string[] {
  return result.criteria.filter((item) => !item.passed).map((item) => item.id);
}

describe('runScenarioOnce', () => {
  it('reprova quando o agent responde sem consultar a central de ajuda', async () => {
    const script: ScriptedEntry[] = [
      understood('question', 'Horário'),
      { type: 'respond', text: 'Atendemos até as 18h.' },
    ];
    const result = await runScenarioOnce(horarioAtendimento, providerWith(script), 1);
    expect(result.passed).toBe(false);
    expect(failedIds(result)).toEqual(
      expect.arrayContaining(['used-searched_knowledge', 'cited-horario-service-desk-aplicável']),
    );
  });

  it('reprova quando a resposta vaza dados de chamado de outro funcionário', async () => {
    const script: ScriptedEntry[] = [
      understood('ticket_status', 'Consulta do INC-20517'),
      { type: 'respond', text: 'O chamado "VPN sem acesso à rede da filial" é da Carla Mendes.' },
    ];
    const result = await runScenarioOnce(chamadoAlheio, providerWith(script), 1);
    expect(result.passed).toBe(false);
    expect(failedIds(result)).toEqual(
      expect.arrayContaining([
        'no-foreign-ticket-data',
        'omits-Carla|filial|Opera[cç][õo]es|servidores',
      ]),
    );
  });

  it('trata chamada ao modelo fora do roteiro como falha do turno', async () => {
    const result = await runScenarioOnce(horarioAtendimento, providerWith([]), 2);
    expect(result.run).toBe(2);
    expect(result.passed).toBe(false);
    expect(result.failureCode).toBe('agent_unavailable');
    expect(result.metrics.costUsd).toBe(0);
  });

  it('registra custo, tokens e modelos da execução', async () => {
    const script: ScriptedEntry[] = [
      { ...understood('question', 'Horário'), usage: USAGE } as ScriptedEntry,
      { type: 'respond', text: 'Das 8h às 18h.', usage: USAGE },
    ];
    const result = await runScenarioOnce(horarioAtendimento, providerWith(script), 1);
    expect(result.metrics.inputTokens).toBe(USAGE.inputTokens * 2);
    expect(result.metrics.outputTokens).toBe(USAGE.outputTokens * 2);
    expect(result.metrics.costUsd).toBeGreaterThan(0);
    expect(result.metrics.models).toEqual(['router-model', 'response-model']);
    expect(result.metrics.firstTokenMs).not.toBeNull();
  });

  it('não guarda textos de mensagens nem de respostas no resultado', async () => {
    const script: ScriptedEntry[] = [
      understood('question', 'Horário'),
      { type: 'respond', text: 'Atendemos até as 18h.' },
    ];
    const result = await runScenarioOnce(horarioAtendimento, providerWith(script), 1);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(horarioAtendimento.userMessage);
    expect(serialized).not.toContain('Atendemos até as 18h.');
  });
});
