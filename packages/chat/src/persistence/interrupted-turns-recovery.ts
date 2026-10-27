import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { PinoLogger } from '@nexo/shared/logger';
import { RecoverInterruptedTurns } from '../core/send/recover-interrupted-turns.js';

const LOG_CONTEXT = 'chat';

@Injectable()
export class InterruptedTurnsRecovery implements OnApplicationBootstrap {
  constructor(
    private readonly recover: RecoverInterruptedTurns,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  async onApplicationBootstrap(): Promise<void> {
    const recovered = await this.recover.execute();
    if (recovered > 0) {
      this.logger.warn({ recovered }, 'turnos interrompidos por reinício foram liberados');
    }
  }
}
