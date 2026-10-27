import { type TicketsApi, TicketsUnavailableError } from '@nexo/contracts';
import type { AgentLogger } from '../../core/agent-logger.js';
import { ResilientExecutor } from './resilient-executor.js';
import type { BasePolicy } from './retry-policy.js';

const SERVICE_NAME = 'sistema de chamados';

export type ResilientTicketsOptions = { logger?: AgentLogger; policy?: BasePolicy };

function isUnavailable(error: unknown): boolean {
  return error instanceof TicketsUnavailableError;
}

export class ResilientTicketsApi implements TicketsApi {
  private readonly executor: ResilientExecutor;

  constructor(
    private readonly inner: TicketsApi,
    options: ResilientTicketsOptions = {},
  ) {
    this.executor = new ResilientExecutor({
      ...options,
      service: SERVICE_NAME,
      isTransient: isUnavailable,
      toUnavailable: (cause) => new TicketsUnavailableError({ cause }),
    });
  }

  listOwn: TicketsApi['listOwn'] = (input) =>
    this.executor.run('listOwn', () => this.inner.listOwn(input));

  findOwn: TicketsApi['findOwn'] = (input) =>
    this.executor.run('findOwn', () => this.inner.findOwn(input));

  searchOwn: TicketsApi['searchOwn'] = (input) =>
    this.executor.run('searchOwn', () => this.inner.searchOwn(input));

  findDuplicates: TicketsApi['findDuplicates'] = (input) =>
    this.executor.run('findDuplicates', () => this.inner.findDuplicates(input));

  assessPriority: TicketsApi['assessPriority'] = (facts) =>
    this.executor.run('assessPriority', () => this.inner.assessPriority(facts));

  contactDeadline: TicketsApi['contactDeadline'] = (input) =>
    this.executor.run('contactDeadline', () => this.inner.contactDeadline(input));

  create: TicketsApi['create'] = (input) =>
    this.executor.run('create', () => this.inner.create(input));

  complement: TicketsApi['complement'] = (input) =>
    this.executor.run('complement', () => this.inner.complement(input));

  reopen: TicketsApi['reopen'] = (input) =>
    this.executor.run('reopen', () => this.inner.reopen(input));
}
