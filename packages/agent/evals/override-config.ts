import type { Env } from '@nexo/shared/config';
import type { AgentSettingsSource } from '../src/persistence/agent-settings.factory.js';

export function overrideConfig(
  base: AgentSettingsSource,
  overrides: Partial<Env>,
): AgentSettingsSource {
  return {
    get: <TKey extends keyof Env>(key: TKey): Env[TKey] => overrides[key] ?? base.get(key),
  };
}
