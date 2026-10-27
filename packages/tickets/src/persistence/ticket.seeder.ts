import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { AppConfig } from '@nexo/shared/config';
import { CLOCK, type Clock } from '../core/clock.js';
import { DrizzleTicketRepository } from './drizzle-ticket.repository.js';
import { buildSeedSaves } from './seed/build-seed-saves.js';

@Injectable()
export class TicketSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly config: AppConfig,
    private readonly repository: DrizzleTicketRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get('SEED_DEMO_DATA')) {
      return;
    }
    if ((await this.repository.count()) > 0) {
      return;
    }
    for (const save of buildSeedSaves(this.clock.now())) {
      await this.repository.save(save);
    }
  }
}
