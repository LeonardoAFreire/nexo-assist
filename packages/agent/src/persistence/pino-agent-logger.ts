import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@nexo/shared/logger';
import type { AgentLogger, LogFields } from '../core/agent-logger.js';

const LOG_CONTEXT = 'agent';

@Injectable()
export class PinoAgentLogger implements AgentLogger {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LOG_CONTEXT);
  }

  info(fields: LogFields, message: string): void {
    this.logger.info(fields, message);
  }

  warn(fields: LogFields, message: string): void {
    this.logger.warn(fields, message);
  }
}
