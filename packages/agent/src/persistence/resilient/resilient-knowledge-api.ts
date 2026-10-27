import type { KnowledgeApi } from '@nexo/contracts';
import type { AgentLogger } from '../../core/agent-logger.js';
import { ResilientExecutor } from './resilient-executor.js';
import type { BasePolicy } from './retry-policy.js';

const SERVICE_NAME = 'central de ajuda';
const KNOWLEDGE_UNAVAILABLE_MESSAGE = 'A central de ajuda está indisponível.';

export type ResilientKnowledgeOptions = { logger?: AgentLogger; policy?: BasePolicy };

export class KnowledgeUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super(KNOWLEDGE_UNAVAILABLE_MESSAGE, options);
    this.name = 'KnowledgeUnavailableError';
  }
}

export class ResilientKnowledgeApi implements KnowledgeApi {
  private readonly executor: ResilientExecutor;

  constructor(
    private readonly inner: KnowledgeApi,
    options: ResilientKnowledgeOptions = {},
  ) {
    this.executor = new ResilientExecutor({
      ...options,
      service: SERVICE_NAME,
      isTransient: () => true,
      toUnavailable: (cause) => new KnowledgeUnavailableError({ cause }),
    });
  }

  search: KnowledgeApi['search'] = (input) =>
    this.executor.run('search', () => this.inner.search(input));

  get: KnowledgeApi['get'] = (input) => this.executor.run('get', () => this.inner.get(input));
}
