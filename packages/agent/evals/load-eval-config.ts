import type { AgentSettingsSource } from '../src/persistence/agent-settings.factory.js';
import { overrideConfig } from './override-config.js';

const MISSING_KEY_MESSAGE =
  'OPENROUTER_API_KEY não configurada. Os evals usam o modelo real: copie .env.example para .env e preencha a chave.';
const INVALID_CONFIG_MESSAGE =
  'Configuração inválida para os evals. Copie .env.example para .env e preencha OPENROUTER_API_KEY';

export type EvalConfig = {
  source: AgentSettingsSource;
  close: () => Promise<void>;
};

type OpenedConfig = {
  source: AgentSettingsSource;
  close: () => Promise<void>;
};

async function openConfig(): Promise<OpenedConfig> {
  try {
    const { NestFactory } = await import('@nestjs/core');
    const { AppConfig, NexoConfigModule } = await import('@nexo/shared/config');
    const context = await NestFactory.createApplicationContext(NexoConfigModule, {
      logger: false,
      abortOnError: false,
    });
    return { source: context.get(AppConfig), close: () => context.close() };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'erro desconhecido';
    throw new Error(`${INVALID_CONFIG_MESSAGE} (${detail}).`, { cause: error });
  }
}

export async function loadEvalConfig(): Promise<EvalConfig> {
  const { source, close } = await openConfig();
  if (source.get('OPENROUTER_API_KEY') === undefined) {
    await close();
    throw new Error(MISSING_KEY_MESSAGE);
  }
  return { source: overrideConfig(source, { LLM_PROVIDER: 'openrouter' }), close };
}
