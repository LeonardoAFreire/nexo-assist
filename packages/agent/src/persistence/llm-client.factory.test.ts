import { describe, expect, it } from 'vitest';
import { createLlmClient, OPENROUTER_EXTRA_BODY } from './llm-client.factory.js';
import type { AgentSettingsSource } from './agent-settings.factory.js';

function sourceOf(values: Record<string, unknown>): AgentSettingsSource {
  return { get: (key: string) => values[key] } as AgentSettingsSource;
}

describe('createLlmClient', () => {
  it('desliga o raciocínio dos modelos para não consumir o limite de tokens da resposta', () => {
    expect(OPENROUTER_EXTRA_BODY).toEqual({ reasoning: { enabled: false } });
  });

  it('exige a chave do OpenRouter quando o provedor não é o roteirizado', () => {
    const source = sourceOf({ LLM_PROVIDER: 'openrouter' });
    expect(() => createLlmClient(source)).toThrow('OPENROUTER_API_KEY não configurada');
  });

  it('cria o cliente roteirizado sem chave', () => {
    expect(createLlmClient(sourceOf({ LLM_PROVIDER: 'scripted' }))).toBeDefined();
  });
});
